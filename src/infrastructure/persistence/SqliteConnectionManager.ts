/**
 * SqliteConnectionManager - Database Connection Management
 *
 * Implements IDbConnectionManager port interface using better-sqlite3.
 *
 * Design Pattern: RAII (Resource Acquisition Is Initialization)
 * - Resource (DB connection) acquired in constructor
 * - Resource released in dispose()
 * - Ensures deterministic cleanup
 *
 * Lifecycle:
 * 1. Created once at application startup in bootstrap()
 * 2. Injected into projection stores that need database access
 * 3. Disposed once at application exit in CLI entry point
 *
 * Architecture:
 * - Infrastructure Layer: Defines IDbConnectionManager interface and SqliteConnectionManager implementation
 * - Presentation Layer: Never touches this directly (uses container)
 *
 * @example
 * ```typescript
 * // In bootstrap (composition root)
 * const dbConnectionManager = new SqliteConnectionManager(`${jumboRoot}/jumbo.db`);
 * const sessionStore = new SqliteSessionProjectionStore(dbConnectionManager);
 * return { dbConnectionManager, sessionStore, ... };
 *
 * // In CLI entry point
 * const container = bootstrap(jumboRoot);
 * try {
 *   await program.parseAsync();
 * } finally {
 *   await container.dbConnectionManager.dispose(); // Cleanup once
 * }
 *
 * // In projection store
 * class SqliteSessionProjectionStore {
 *   constructor(private dbManager: IDbConnectionManager) {}
 *
 *   async save(projection: SessionProjection): Promise<void> {
 *     const db = this.dbManager.getConnection();
 *     // Use connection...
 *   }
 * }
 * ```
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { IDbConnectionManager } from "./IDbConnectionManager.js";
import { MigrationRunner } from "./MigrationRunner.js";
import { getNamespaceMigrations } from "./migrations.config.js";

export class SqliteConnectionManager implements IDbConnectionManager {
  private connection: Database.Database;

  /**
   * Create a new database connection manager.
   *
   * RAII Pattern: Resource acquisition happens here.
   * The database connection is opened immediately and configured.
   * For new databases, migrations are run automatically.
   *
   * @param dbPath - Absolute path to the SQLite database file
   */
  constructor(dbPath: string) {
    // Check if this is a new database (file doesn't exist yet)
    const isNewDatabase = !fs.existsSync(dbPath);

    // RAII: Acquire resource on construction
    this.connection = new Database(dbPath);

    // Configure database for optimal performance
    this.connection.pragma("journal_mode = WAL"); // Write-Ahead Logging for better concurrency

    // Run migrations automatically for new databases
    if (isNewDatabase) {
      const infrastructureDir = path.resolve(__dirname, "../..");
      const migrations = getNamespaceMigrations(infrastructureDir);
      const migrationRunner = new MigrationRunner(this.connection);
      migrationRunner.runNamespaceMigrations(migrations);
    }
  }

  /**
   * Get the database connection instance.
   *
   * @returns The initialized and configured database connection
   */
  getConnection(): Database.Database {
    return this.connection;
  }

  /**
   * Release the database connection.
   *
   * RAII Pattern: Resource release happens here.
   * Should be called exactly once at application exit.
   *
   * Idempotent: Safe to call multiple times (connection is nulled after close).
   *
   * Performs WAL checkpoint before closing to ensure WAL files are
   * properly truncated and released (important for Windows).
   *
   * @returns Promise that resolves when connection is closed
   */
  async dispose(): Promise<void> {
    if (this.connection && this.connection.open) {
      // Checkpoint and truncate WAL to release locks on Windows
      this.connection.pragma("wal_checkpoint(TRUNCATE)");
      this.connection.close();
    }
  }
}
