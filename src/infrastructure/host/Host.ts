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
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "node:url";
import { ITelemetryClient } from "../../application/telemetry/ITelemetryClient.js";
import { HostBuilder } from "./HostBuilder.js";
import { MigrationRunner } from "../persistence/MigrationRunner.js";
import { getNamespaceMigrations } from "../persistence/migrations.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Host {
  private readonly rootDir: string;
  private db: Database.Database | null = null;
  private telemetryClient: ITelemetryClient | null = null;
  private telemetryShutdownPromise: Promise<void> | null = null;
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
    fs.ensureDirSync(this.rootDir);

    // Initialize database connection
    const dbPath = path.join(this.rootDir, "jumbo.db");
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");

    const infrastructureDir = path.resolve(__dirname, "..");
    const migrations = getNamespaceMigrations(infrastructureDir);
    const migrationRunner = new MigrationRunner(this.db);
    migrationRunner.runNamespaceMigrations(migrations);

    return new HostBuilder(this.rootDir, this.db, (telemetryClient) => {
      this.telemetryClient = telemetryClient;
    });
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
      this.cleanupSync();
    };

    const cleanupAsync = async () => {
      await this.cleanupAsync();
    };

    process.on("beforeExit", () => {
      void cleanupAsync();
    });

    // Handle normal exit
    process.on("exit", cleanup);

    // Handle Ctrl+C
    process.on("SIGINT", async () => {
      await cleanupAsync();
      process.exit(130); // Standard exit code for SIGINT
    });

    // Handle kill command
    process.on("SIGTERM", async () => {
      await cleanupAsync();
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
  private cleanupSync(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    void this.shutdownTelemetry();
    this.closeDatabase();
  }

  private async cleanupAsync(): Promise<void> {
    if (this.disposed) {
      await this.awaitTelemetryShutdown();
      return;
    }

    this.disposed = true;
    await this.shutdownTelemetry();
    this.closeDatabase();
  }

  private async shutdownTelemetry(): Promise<void> {
    if (this.telemetryShutdownPromise !== null) {
      await this.telemetryShutdownPromise;
      return;
    }

    if (this.telemetryClient === null) {
      return;
    }

    this.telemetryShutdownPromise = this.telemetryClient.shutdown()
      .catch(() => {
        // Telemetry must never affect host shutdown.
      })
      .finally(() => {
        this.telemetryClient = null;
      });

    await this.telemetryShutdownPromise;
  }

  private async awaitTelemetryShutdown(): Promise<void> {
    if (this.telemetryShutdownPromise !== null) {
      await this.telemetryShutdownPromise;
    }
  }

  private closeDatabase(): void {
    if (this.db && this.db.open) {
      this.db.pragma("wal_checkpoint(TRUNCATE)");
      this.db.close();
      this.db = null;
    }
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
    this.cleanupSync();
  }
}
