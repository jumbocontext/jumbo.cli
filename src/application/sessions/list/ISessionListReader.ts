/**
 * Port interface for listing sessions from the projection store.
 * Used by ListSessionsQueryHandler to retrieve session history.
 */

import { SessionView } from "../SessionView.js";

export type SessionStatusFilter = "active" | "paused" | "ended" | "all";

export interface ISessionListReader {
  /**
   * Retrieves all sessions, optionally filtered by status.
   * @param status - Filter by status, or "all" for all sessions
   * @returns Array of session views ordered by creation date (newest first)
   */
  findAll(status?: SessionStatusFilter): Promise<SessionView[]>;
}
