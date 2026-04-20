import Database from "better-sqlite3";
import fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import { fileURLToPath } from "node:url";
import { Host } from "../../../src/infrastructure/host/Host";
import { MigrationRunner } from "../../../src/infrastructure/persistence/MigrationRunner";
import { getNamespaceMigrations } from "../../../src/infrastructure/persistence/migrations.config";
import { jest } from "@jest/globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Host", () => {
  let tempDir: string;

  async function waitForWalCleanup(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-host-"));
  });

  afterEach(async () => {
    await waitForWalCleanup();
    await fs.remove(tempDir);
    jest.restoreAllMocks();
  });

  it("bootstraps a stale database by applying pending worker migrations before build", async () => {
    const dbPath = path.join(tempDir, "jumbo.db");
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");

    const infrastructureDir = path.resolve(__dirname, "../../../src/infrastructure");
    const allMigrations = getNamespaceMigrations(infrastructureDir);
    const migrationsWithoutWorkers = allMigrations.filter(
      (migration) => migration.namespace !== "workers"
    );

    new MigrationRunner(db).runNamespaceMigrations(migrationsWithoutWorkers);
    expect(
      db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'workers'").get()
    ).toBeUndefined();
    db.pragma("wal_checkpoint(TRUNCATE)");
    db.close();

    const host = new Host(tempDir);
    const builder = host.createBuilder();
    await builder.build();

    const migratedDb = new Database(dbPath, { readonly: true });
    const workersTable = migratedDb
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'workers'")
      .get();

    expect(workersTable).toBeDefined();

    migratedDb.close();
    host.dispose();
    await waitForWalCleanup();
  });
});
