import { ContextualGoalView } from "./ContextualGoalView.js";

/**
 * Assembles goal context by querying relations and fetching related entities.
 *
 * Uses relation-based context aggregation:
 * 1. Query relations where fromEntity = goal
 * 2. Batch fetch related entities by type
 * 3. Merge entity data with relation metadata
 * 4. Assemble complete ContextualGoalView (goal + context)
 *
 * This ensures context is always fresh (no staleness from denormalized projections).
 */
export interface IGoalContextAssembler {
  /**
   * Assembles complete context for a goal from relations and entity readers.
   * Returns null if goal not found.
   *
   * All arrays in returned context are guaranteed non-null with no null items.
   */
  assembleContextForGoal(goalId: string): Promise<ContextualGoalView | null>;
}
