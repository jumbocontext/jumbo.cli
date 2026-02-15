import { ShowGoalCommand } from "./ShowGoalCommand.js";
import { GoalContextQueryHandler } from "../../../context/GoalContextQueryHandler.js";
import { GoalContextViewMapper } from "../../../context/GoalContextViewMapper.js";
import { GoalContextView } from "../get-context/GoalContextView.js";

/**
 * Handles showing goal details.
 * Pure query operation - no state changes, no events.
 * Returns enriched goal context view for presentation layer.
 */
export class ShowGoalCommandHandler {
  constructor(
    private readonly goalContextQueryHandler: GoalContextQueryHandler,
    private readonly goalContextViewMapper: GoalContextViewMapper
  ) {}

  async execute(command: ShowGoalCommand): Promise<GoalContextView> {
    // Query goal context and map to presentation view
    const context = await this.goalContextQueryHandler.execute(command.goalId);
    const contextView = this.goalContextViewMapper.map(context);

    return contextView;
  }
}
