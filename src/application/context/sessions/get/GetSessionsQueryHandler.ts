/**
 * GetSessionsQueryHandler - Query handler for listing session history.
 *
 * This is a standard CQRS query handler that provides read access to
 * the Session projection for listing purposes with optional filtering.
 *
 * Usage:
 *   const query = new GetSessionsQueryHandler(sessionViewReader);
 *   const sessions = await query.execute();
 *   const activeSessions = await query.execute("active");
 *
 * Returns:
 *   - Array of SessionView ordered by creation date (newest first)
 *   - Empty array if no sessions exist
 */

import { ISessionViewReader, SessionStatusFilter } from "./ISessionViewReader.js";
import { SessionView } from "../SessionView.js";

export class GetSessionsQueryHandler {
  constructor(
    private readonly sessionViewReader: ISessionViewReader
  ) {}

  /**
   * Execute query to retrieve sessions.
   *
   * @param status - Optional filter by status ("active", "paused", "ended", "all")
   * @returns Array of SessionView sorted by creation date (newest first)
   */
  async execute(status: SessionStatusFilter = "all"): Promise<SessionView[]> {
    return this.sessionViewReader.findAll(status);
  }
}
