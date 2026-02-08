import { SessionSummaryProjection } from "../SessionSummaryView.js";

/**
 * Port interface for reading session summary from the projection store.
 * Used by SessionStartContextQueryHandler to get latest session context.
 */
export interface ISessionSummaryReader {
  findLatest(): Promise<SessionSummaryProjection | null>;
}
