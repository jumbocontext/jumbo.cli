/**
 * Infrastructure implementation of database rebuild service.
 *
 * Rebuilds SQLite projections by replaying all persisted events through
 * projection-only handlers. No side-effect handlers (cascades, maintenance
 * goal registrars) run during rebuild — their output events are already
 * in the event store from original execution and are replayed naturally.
 *
 * Accepts a createProjectionBus callback that wires projection-only
 * handlers for a given database instance. This avoids duplicating the
 * composition root while keeping rebuild infrastructure-agnostic.
 */

import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { ILogger } from "../../application/logging/ILogger.js";
import {
  IDatabaseRebuildService,
  DatabaseRebuildResult,
} from "../../application/maintenance/db/rebuild/IDatabaseRebuildService.js";
import { IEventStore } from "../../application/persistence/IEventStore.js";
import { IEventBus } from "../../application/messaging/IEventBus.js";
import { MigrationRunner } from "../persistence/MigrationRunner.js";
import { getNamespaceMigrations } from "../persistence/migrations.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class LocalDatabaseRebuildService implements IDatabaseRebuildService {
  private readonly tag = "[DatabaseRebuild]";

  constructor(
    private readonly rootDir: string,
    private readonly db: Database.Database,
    private readonly eventStore: IEventStore,
    private readonly createProjectionBus: (db: Database.Database) => IEventBus,
    private readonly logger: ILogger
  ) {}

  async rebuild(): Promise<DatabaseRebuildResult> {
    this.logger.info(`${this.tag} Starting database rebuild`);
    const dbPath = path.join(this.rootDir, "jumbo.db");

    // Step 1: Close existing database connection
    this.logger.debug(`${this.tag} Closing existing database connection`);
    if (this.db && this.db.open) {
      this.db.pragma("wal_checkpoint(TRUNCATE)");
      this.db.close();
    }

    // Step 2: Delete the database file and WAL/SHM files
    for (const filePath of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
      if (await fs.pathExists(filePath)) {
        this.logger.debug(`${this.tag} Deleting file`, { filePath });
        await fs.remove(filePath);
      }
    }

    // Step 3: Create new database connection and run migrations
    this.logger.debug(`${this.tag} Creating new database and running migrations`);
    const newDb = new Database(dbPath);
    newDb.pragma("journal_mode = WAL");

    const infrastructureDir = path.resolve(__dirname, "..");
    const migrations = getNamespaceMigrations(infrastructureDir);
    const migrationRunner = new MigrationRunner(newDb);
    migrationRunner.runNamespaceMigrations(migrations);
    this.logger.debug(`${this.tag} Migrations complete`);

    // Step 4: Create projection-only event bus
    const projectionBus = this.createProjectionBus(newDb);

    // Step 5: Replay all events through projection-only handlers
    this.logger.debug(`${this.tag} Loading events from event store`);
    const events = await this.eventStore.getAllEvents();
    this.logger.info(`${this.tag} Loaded events for replay`, { eventCount: events.length });

    let processedCount = 0;
    for (const event of events) {
      try {
        await projectionBus.publish(event);
        processedCount++;
      } catch (error) {
        this.logger.error(`${this.tag} Failed to replay event`, error instanceof Error ? error : undefined, {
          eventType: event.type,
          aggregateId: event.aggregateId,
          processedSoFar: processedCount,
        });
        throw error;
      }
    }

    // Step 6: Close the rebuild database connection
    if (newDb && newDb.open) {
      newDb.pragma("wal_checkpoint(TRUNCATE)");
      newDb.close();
    }

    this.logger.info(`${this.tag} Database rebuild complete`, { eventsReplayed: processedCount });

    return {
      eventsReplayed: processedCount,
      success: true,
    };
  }
}
