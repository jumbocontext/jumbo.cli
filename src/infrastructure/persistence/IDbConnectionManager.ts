/**
 * IDbConnectionManager Interface
 *
 * Defines the contract for database connection management.
 * Infrastructure-internal interface - not a port since no application layer consumers.
 *
 * Design Principles:
 * - **RAII Pattern**: Connection acquired on construction, released on disposal
 * - **Singleton Lifecycle**: Single connection instance managed at composition root
 *
 * Responsibilities:
 * - Provide access to database connection
 * - Manage connection lifecycle (open on construction, close on disposal)
 * - Ensure connection is properly configured (WAL mode, etc.)
 *
 * Implementation Notes:
 * - Concrete implementation (SqliteConnectionManager) lives in infrastructure layer
 * - Connection is created in constructor (RAII acquisition)
 * - Connection is closed in dispose() (RAII release)
 * - Presentation layer (CLI commands) NEVER calls dispose() directly
 * - CLI entry point manages disposal at application exit
 *
 * @example
 * ```typescript
 * // Infrastructure implementation
 * class SqliteConnectionManager implements IDbConnectionManager {
 *   private connection: Database;
 *
 *   constructor(dbPath: string) {
 *     // RAII: Acquire resource on construction
 *     this.connection = new Database(dbPath);
 *     this.connection.pragma("journal_mode = WAL");
 *   }
 *
 *   getConnection(): Database {
 *     return this.connection;
 *   }
 *
 *   async dispose(): Promise<void> {
 *     // RAII: Release resource on disposal
 *     if (this.connection) {
 *       this.connection.close();
 *     }
 *   }
 * }
 *
 * // Composition root
 * function bootstrap(jumboRoot: string): ApplicationContainer {
 *   const dbConnectionManager = new SqliteConnectionManager(`${jumboRoot}/jumbo.db`);
 *   return { dbConnectionManager, ... };
 * }
 *
 * // CLI entry point
 * async function main() {
 *   const container = bootstrap(jumboRoot);
 *   try {
 *     await program.parseAsync();
 *   } finally {
 *     await container.dbConnectionManager.dispose(); // Cleanup once at exit
 *   }
 * }
 * ```
 */

import { IDisposable } from "./IDisposable.js";
import Database from "better-sqlite3";

export interface IDbConnectionManager extends IDisposable {
  /**
   * Get the database connection instance.
   *
   * The connection is guaranteed to be:
   * - Initialized and ready for use
   * - Configured with appropriate settings (e.g., WAL mode)
   * - The same instance across all calls (singleton)
   *
   * @returns The database connection instance
   */
  getConnection(): Database.Database;
}
