import { EnrichedSessionContext } from "../get/EnrichedSessionContext.js";

/**
 * SessionStartResponse - Result of starting a new session.
 *
 * Contains the enriched session context (with LLM instruction signals)
 * and the newly created session ID.
 */
export interface SessionStartResponse {
  readonly context: EnrichedSessionContext;
  readonly sessionId: string;
}
