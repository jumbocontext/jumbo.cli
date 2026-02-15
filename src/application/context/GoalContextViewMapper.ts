import { GoalContext } from "./goals/get-context/GoalContext.js";
import { GoalContextView } from "./goals/get-context/GoalContextView.js";

/**
 * GoalContextViewMapper - Maps GoalContext to GoalContextView.
 *
 * Responsible for:
 * - Converting application-layer GoalContext to presentation-layer GoalContextView
 * - Filtering/obfuscating sensitive properties (if needed)
 * - Enriching with presentation-specific data (if needed)
 *
 * Currently a passthrough mapper, but provides flexibility for future evolution.
 */
export class GoalContextViewMapper {
  /**
   * Map GoalContext to GoalContextView.
   *
   * @param context - The application-layer context
   * @returns Presentation-layer view
   */
  map(context: GoalContext): GoalContextView {
    // Currently a direct mapping, but this gives us a seam
    // to add filtering/enrichment logic in the future
    return {
      goal: context.goal,
      components: context.components,
      dependencies: context.dependencies,
      decisions: context.decisions,
      invariants: context.invariants,
      guidelines: context.guidelines,
      architecture: context.architecture,
    };
  }
}
