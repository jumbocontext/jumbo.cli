import Database from "better-sqlite3";
import fs from "fs-extra";
import * as path from "path";
import { fileURLToPath } from "node:url";
import { ProjectionBusFactory } from "../../../src/infrastructure/messaging/ProjectionBusFactory";
import { MigrationRunner } from "../../../src/infrastructure/persistence/MigrationRunner";
import { getNamespaceMigrations } from "../../../src/infrastructure/persistence/migrations.config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("ProjectionBusFactory", () => {
  let tmpDir: string;
  let db: Database.Database;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(process.cwd(), "test-projection-bus-"));
    const dbPath = path.join(tmpDir, "jumbo.db");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    const infrastructureDir = path.resolve(__dirname, "../../../src/infrastructure");
    const migrations = getNamespaceMigrations(infrastructureDir);
    const migrationRunner = new MigrationRunner(db);
    migrationRunner.runNamespaceMigrations(migrations);
  });

  afterEach(async () => {
    if (db && db.open) db.close();
    await fs.remove(tmpDir);
  });

  it("creates an event bus that projects ComponentDeprecatedEvent without triggering cascades", async () => {
    const factory = new ProjectionBusFactory();
    const bus = factory.create(db);

    // First add the component so deprecation has something to update
    await bus.publish({
      type: "ComponentAddedEvent",
      aggregateId: "comp-1",
      version: 1,
      timestamp: "2026-01-01T00:00:00.000Z",
      payload: {
        name: "TestComponent",
        type: "service",
        description: "A test component",
        responsibility: "",
        path: "",
        status: "active",
      },
    } as any);

    // Deprecate it — should project without cascade errors
    await bus.publish({
      type: "ComponentDeprecatedEvent",
      aggregateId: "comp-1",
      version: 2,
      timestamp: "2026-01-01T01:00:00.000Z",
      payload: {
        status: "deprecated",
        reason: "No longer needed",
        deprecatedAt: "2026-01-01T01:00:00.000Z",
      },
    } as any);

    const rows = db.prepare("SELECT * FROM component_views").all();
    expect(rows).toHaveLength(1);
    const row = rows[0] as any;
    expect(row.status).toBe("deprecated");
  });

  it("creates an event bus that projects RelationDeactivatedEvent directly", async () => {
    const factory = new ProjectionBusFactory();
    const bus = factory.create(db);

    // Add a relation
    await bus.publish({
      type: "RelationAddedEvent",
      aggregateId: "rel-1",
      version: 1,
      timestamp: "2026-01-01T00:00:00.000Z",
      payload: {
        fromEntityType: "goal",
        fromEntityId: "goal-1",
        toEntityType: "component",
        toEntityId: "comp-1",
        relationType: "involves",
        strength: null,
        description: "Test relation",
      },
    } as any);

    // Deactivate it directly (as persisted by original cascade)
    await bus.publish({
      type: "RelationDeactivatedEvent",
      aggregateId: "rel-1",
      version: 2,
      timestamp: "2026-01-01T01:00:00.000Z",
      payload: {
        reason: "Component deprecated",
        deactivatedAt: "2026-01-01T01:00:00.000Z",
      },
    } as any);

    const row = db.prepare("SELECT status FROM relation_views WHERE relationId = ?").get("rel-1") as any;
    expect(row.status).toBe("deactivated");
  });

  it("creates an event bus that projects DecisionSupersededEvent without triggering cascades", async () => {
    const factory = new ProjectionBusFactory();
    const bus = factory.create(db);

    await bus.publish({
      type: "DecisionAddedEvent",
      aggregateId: "dec-1",
      version: 1,
      timestamp: "2026-01-01T00:00:00.000Z",
      payload: {
        title: "Test Decision",
        context: "Context",
        rationale: "Rationale",
        alternatives: [],
        consequences: null,
      },
    } as any);

    await bus.publish({
      type: "DecisionSupersededEvent",
      aggregateId: "dec-1",
      version: 2,
      timestamp: "2026-01-01T01:00:00.000Z",
      payload: {
        supersededBy: "dec-2",
        supersededAt: "2026-01-01T01:00:00.000Z",
      },
    } as any);

    const row = db.prepare("SELECT status FROM decision_views WHERE decisionId = ?").get("dec-1") as any;
    expect(row.status).toBe("superseded");
  });
});
