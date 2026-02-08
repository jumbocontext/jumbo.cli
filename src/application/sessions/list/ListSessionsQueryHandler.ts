/**
 * ListSessionsQueryHandler - Query handler for listing session history.
 *
 * This is a standard CQRS query handler that provides read access to
 * the Session projection for listing purposes with optional filtering.
 *
 * Usage:
 *   const query = new ListSessionsQueryHandler(sessionListReader);
 *   const sessions = await query.execute();
 *   const activeSessions = await query.execute("active");
 *
 * Returns:
 *   - Array of SessionView ordered by creation date (newest first)
 *   - Empty array if no sessions exist
 */

import { ISessionListReader, SessionStatusFilter } from "./ISessionListReader.js";
import { SessionView } from "../SessionView.js";

export class ListSessionsQueryHandler {
  constructor(
    private readonly sessionListReader: ISessionListReader
  ) {}

  /**
   * Execute query to retrieve sessions.
   *
   * @param status - Optional filter by status ("active", "paused", "ended", "all")
   * @returns Array of SessionView sorted by creation date (newest first)
   */
  async execute(status: SessionStatusFilter = "all"): Promise<SessionView[]> {
    return this.sessionListReader.findAll(status);
  }
}
