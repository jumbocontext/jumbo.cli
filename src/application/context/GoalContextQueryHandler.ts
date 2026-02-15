import { IGoalContextAssembler } from "./IGoalContextAssembler.js";
import { GoalContext } from "./goals/get-context/GoalContext.js";

/**
 * GetGoalContextQueryHandler - Query handler for goal context retrieval
 *
 * Retrieves comprehensive relation-based context for a goal by delegating to IGoalContextAssembler.
 *
 * Returns pure GoalContext (core data only, no enrichment).
 * Command handlers are responsible for enriching context with event-specific details:
 * - StartGoalCommandHandler → StartGoalContextView (adds start-specific prompt)
 * - ReviewGoalCommandHandler → ReviewGoalContextView (adds review-specific prompt)
 * - etc.
 *
 * This maintains clean separation of concerns per CQRS:
 * - Query layer: retrieves data
 * - Command/Presentation layer: enriches for specific use cases
 */
export class GoalContextQueryHandler {
  constructor(
    private readonly assembler: IGoalContextAssembler
  ) {}

  /**
   * Execute the query to get goal context
   *
   * @param goalId - ID of the goal to get context for
   * @returns GoalContext with all related entities (no enrichment)
   * @throws Error if goal not found
   */
  async execute(goalId: string): Promise<GoalContext> {
    const context = await this.assembler.assembleContextForGoal(goalId);

    if (!context) {
      throw new Error(`Goal not found: ${goalId}`);
    }

    return context;
  }
}
