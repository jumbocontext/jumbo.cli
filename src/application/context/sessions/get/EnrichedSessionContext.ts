import { SessionView } from "../SessionView.js";
import { SessionContext } from "./SessionContext.js";

/**
 * EnrichedSessionContext - Enriched session context with event-specific instructions and scope.
 *
 * Produced by controllers (SessionStartController) and enrichers (SessionResumeContextEnricher)
 * that compose a ContextualSessionView with targeted LLM instruction signals and scope identification.
 *
 * Extends the ContextualSessionView shape with:
 * - instructions: Event-specific LLM instruction signals for presentation layer rendering
 * - scope: Identifies the session event type (e.g., "session-start", "work-resume")
 */
export interface EnrichedSessionContext {
  readonly session: SessionView | null;
  readonly context: SessionContext;

  /**
   * Event-specific LLM instruction signals indicating what guidance applies.
   * Presentation layer maps these signals to rendered instruction text.
   */
  readonly instructions: string[];

  /**
   * Identifies the session event scope (e.g., "session-start", "work-resume").
   */
  readonly scope: string;
}
