import { ISessionSummaryReader } from "./ISessionSummaryReader.js";
import { SessionSummaryProjection } from "../SessionSummaryView.js";

/**
 * GetLatestSessionSummaryQueryHandler - Query handler for retrieving current session summary
 *
 * This is a standard CQRS query handler that provides read access to the
 * SessionSummary projection (the "LATEST" session).
 *
 * Usage:
 *   const query = new GetLatestSessionSummaryQueryHandler(projectionStore);
 *   const summary = await query.execute();
 *
 * Returns:
 *   - SessionSummaryProjection if LATEST exists
 *   - null if no active or recent session exists
 *
 * Performance:
 *   O(1) lookup via primary key (session_id='LATEST')
 */
export class GetLatestSessionSummaryQueryHandler {
  constructor(
    private readonly sessionSummaryReader: ISessionSummaryReader
  ) {}

  /**
   * Execute query to retrieve LATEST session summary
   *
   * @returns SessionSummaryProjection or null if no LATEST exists
   */
  async execute(): Promise<SessionSummaryProjection | null> {
    return this.sessionSummaryReader.findLatest();
  }
}
