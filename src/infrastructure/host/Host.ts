/**
 * Infrastructure Host - Lifecycle Manager
 *
 * Manages infrastructure resources with automatic cleanup via signal handlers.
 * Creates builders for application composition.
 *
 * This class follows the RAII pattern where resources are automatically
 * released on process exit via registered signal handlers.
 *
 * Key Design Principles:
 * - **Self-Disposing**: Registers process signal handlers for automatic cleanup
 * - **No Public dispose()**: Presentation layer never calls cleanup methods
 * - **Builder Factory**: Creates HostBuilder instances for application composition
 * - **Infrastructure Isolation**: Lifecycle management fully encapsulated
 *
 * Lifecycle:
 * 1. Construction: Signal handlers registered
 * 2. Builder Creation: createBuilder() returns configured HostBuilder
 * 3. Runtime: Application uses container from HostBuilder.build()
 * 4. Termination: Process signals trigger automatic resource cleanup
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { HostBuilder } from "./HostBuilder.js";
import { MigrationRunner } from "../persistence/MigrationRunner.js";
import { getNamespaceMigrations } from "../persistence/migrations.config.js";

export class Host {
  private readonly rootDir: string;
  private db: Database.Database | null = null;
  private disposed = false;
  private signalHandlersRegistered = false;

  /**
   * Creates a new Host with self-disposing lifecycle.
   *
   * RAII Pattern: Signal handlers are registered here and will automatically
   * release resources when the process exits.
   *
   * @param rootDir - The root directory for Jumbo data (typically .jumbo)
   */
  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.registerSignalHandlers();
  }

  /**
   * Creates a new HostBuilder for application composition.
   *
   * The builder will create and wire all infrastructure components,
   * returning an IApplicationContainer that the presentation layer can use.
   *
   * @returns HostBuilder instance for building the application container
   */
  createBuilder(): HostBuilder {
    // Ensure root directory exists
    const fsExtra = require("fs-extra");
    fsExtra.ensureDirSync(this.rootDir);

    // Initialize database connection
    const dbPath = path.join(this.rootDir, "jumbo.db");
    const isNewDatabase = !fs.existsSync(dbPath);

    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");

    if (isNewDatabase) {
      const infrastructureDir = path.resolve(__dirname, "..");
      const migrations = getNamespaceMigrations(infrastructureDir);
      const migrationRunner = new MigrationRunner(this.db);
      migrationRunner.runNamespaceMigrations(migrations);
    }

    return new HostBuilder(this.rootDir, this.db);
  }

  /**
   * Registers process signal handlers for automatic resource cleanup.
   *
   * Handles:
   * - 'exit': Normal process termination
   * - 'SIGINT': Interrupt signal (Ctrl+C)
   * - 'SIGTERM': Termination signal (kill command)
   *
   * These handlers ensure resources are properly released even when
   * the process is terminated unexpectedly.
   */
  private registerSignalHandlers(): void {
    if (this.signalHandlersRegistered) {
      return;
    }

    const cleanup = () => {
      this.cleanup();
    };

    // Handle normal exit
    process.on("exit", cleanup);

    // Handle Ctrl+C
    process.on("SIGINT", () => {
      cleanup();
      process.exit(130); // Standard exit code for SIGINT
    });

    // Handle kill command
    process.on("SIGTERM", () => {
      cleanup();
      process.exit(143); // Standard exit code for SIGTERM
    });

    this.signalHandlersRegistered = true;
  }

  /**
   * Internal cleanup method - releases all resources.
   *
   * This method is idempotent and safe to call multiple times.
   * It is called automatically by signal handlers.
   */
  private cleanup(): void {
    if (this.disposed) {
      return;
    }

    if (this.db && this.db.open) {
      this.db.pragma("wal_checkpoint(TRUNCATE)");
      this.db.close();
    }

    this.disposed = true;
  }

  /**
   * Explicitly disposes of resources.
   *
   * This method is intended for testing purposes where the process doesn't
   * exit and signal handlers don't fire. In production, resources are
   * automatically cleaned up via signal handlers.
   *
   * Safe to call multiple times (idempotent).
   */
  dispose(): void {
    this.cleanup();
  }
}
