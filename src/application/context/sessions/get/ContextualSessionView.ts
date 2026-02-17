import { SessionView } from "../SessionView.js";
import { SessionContext } from "./SessionContext.js";

/**
 * ContextualSessionView - Composed return type pairing a session with its context.
 *
 * Combines:
 * - session: The core SessionView entity (null when no active session exists)
 * - context: SessionContext containing all orientation data
 *
 * Follows the Contextual*View convention for application-layer read models.
 * Used as the return type from SessionContextQueryHandler.
 * Session is nullable because first-ever session start has no active session.
 */
export interface ContextualSessionView {
  readonly session: SessionView | null;
  readonly context: SessionContext;
}
