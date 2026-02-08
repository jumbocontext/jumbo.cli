/**
 * IDisposable Interface
 *
 * Defines the contract for resource cleanup in infrastructure components.
 * Implements the Dispose pattern for deterministic resource management.
 *
 * Design Pattern: RAII (Resource Acquisition Is Initialization)
 * - Resources are acquired on construction
 * - Resources are released on disposal
 * - Ensures no resource leaks
 *
 * Used by:
 * - IDbConnectionManager - Closes database connections
 * - Other infrastructure components that manage external resources
 *
 * @example
 * ```typescript
 * class SqliteConnectionManager implements IDisposable {
 *   async dispose(): Promise<void> {
 *     this.connection.close();
 *   }
 * }
 * ```
 */
export interface IDisposable {
  /**
   * Release all resources held by this object.
   * Must be called when the object is no longer needed.
   * Should be idempotent (safe to call multiple times).
   *
   * @returns Promise that resolves when all resources are released
   */
  dispose(): Promise<void>;
}
