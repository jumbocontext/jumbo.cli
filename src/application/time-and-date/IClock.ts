/**
 * Clock abstraction for generating timestamps.
 *
 * Provides a single method to get the current time in ISO 8601 format.
 * This abstraction enables deterministic testing by allowing test doubles
 * to return fixed timestamps.
 */
export interface IClock {
  /**
   * Returns the current time as an ISO 8601 string.
   *
   * @returns ISO 8601 timestamp (e.g., "2025-01-01T00:00:00.000Z")
   */
  nowIso(): string;
}
