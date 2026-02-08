import { IClock } from "../../application/time-and-date/IClock.js";

/**
 * System clock implementation that returns the current system time.
 *
 * Uses JavaScript's Date API to get the current time in ISO 8601 format.
 * This is the production implementation used at runtime.
 */
export class SystemClock implements IClock {
  /**
   * Returns the current system time as an ISO 8601 string.
   *
   * @returns Current time in format: "YYYY-MM-DDTHH:mm:ss.sssZ"
   */
  nowIso(): string {
    return new Date().toISOString();
  }
}
