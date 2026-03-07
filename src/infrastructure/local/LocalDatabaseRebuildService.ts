/**
 * Infrastructure implementation of database rebuild service.
 *
 * Handles all infrastructure concerns for rebuilding the database:
 * - Closing the existing database connection
 * - Deleting the database file
 * - Reinitializing the database with migrations
 * - Replaying all events through the event bus
 *
 * This keeps infrastructure concerns (file operations, connection management)
 * out of the presentation layer.
 */

import fs from "fs-extra";
import path from "path";
import Database from "better-sqlite3";
import { ILogger } from "../../application/logging/ILogger.js";
import {
  IDatabaseRebuildService,
  DatabaseRebuildResult,
} from "../../application/maintenance/db/rebuild/IDatabaseRebuildService.js";
import { IEventStore } from "../../application/persistence/IEventStore.js";
import { IEventBus } from "../../application/messaging/IEventBus.js";

export class LocalDatabaseRebuildService implements IDatabaseRebuildService {
  private readonly tag = "[DatabaseRebuild]";

  constructor(
    private readonly rootDir: string,
    private readonly db: Database.Database,
    private readonly eventStore: IEventStore,
    private readonly eventBus: IEventBus,
    private readonly reinitialize: () => { db: Database.Database; eventBus: IEventBus },
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

    // Step 2: Delete the database file
    if (await fs.pathExists(dbPath)) {
      this.logger.debug(`${this.tag} Deleting existing database file`, { dbPath });
      await fs.remove(dbPath);
    }

    // Also remove WAL and SHM files if they exist
    const walPath = dbPath + "-wal";
    const shmPath = dbPath + "-shm";
    if (await fs.pathExists(walPath)) {
      await fs.remove(walPath);
    }
    if (await fs.pathExists(shmPath)) {
      await fs.remove(shmPath);
    }

    // Step 3: Reinitialize database (creates new connection with migrations)
    this.logger.debug(`${this.tag} Reinitializing database with migrations`);
    const { eventBus: newEventBus } = this.reinitialize();

    // Step 4: Get all events from event store (file-based, still intact)
    this.logger.debug(`${this.tag} Loading events from event store`);
    const events = await this.eventStore.getAllEvents();
    this.logger.info(`${this.tag} Loaded events for replay`, { eventCount: events.length });

    // Step 5: Replay each event through the new event bus
    let processedCount = 0;
    for (const event of events) {
      try {
        await newEventBus.publish(event);
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

    this.logger.info(`${this.tag} Database rebuild complete`, { eventsReplayed: processedCount });

    return {
      eventsReplayed: processedCount,
      success: true,
    };
  }
}
