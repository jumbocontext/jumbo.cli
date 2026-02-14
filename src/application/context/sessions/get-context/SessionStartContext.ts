import { SessionContextView, SessionProjectContext } from "./SessionContext.js";

/**
 * SessionStartContext - Enriched session context for session start events
 *
 * Type alias for SessionContextView. Session start enrichment is provided
 * through the instructions and scope fields of SessionContextView.
 */
export type SessionStartContext = SessionContextView;

/**
 * SessionStartProjectContext - Backward-compatible alias for SessionProjectContext
 */
export type SessionStartProjectContext = SessionProjectContext;
