import { GoalView } from "../GoalView.js";
import { GoalContext } from "./GoalContext.js";

/**
 * ContextualGoalView - Composed return type pairing a goal with its relations.
 *
 * Combines:
 * - goal: The core GoalView entity
 * - context: GoalContext containing all relation collections
 *
 * Follows the *View convention for application-layer read models.
 * Used as the return type from command handlers and query handlers
 * that need to provide a goal together with its contextual relations.
 */
export interface ContextualGoalView {
  readonly goal: GoalView;
  readonly context: GoalContext;
}
