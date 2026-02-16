import { RefineGoalCommand } from "./RefineGoalCommand.js";
import { IGoalRefineEventWriter } from "./IGoalRefineEventWriter.js";
import { IGoalRefineEventReader } from "./IGoalRefineEventReader.js";
import { IGoalRefineReader } from "./IGoalRefineReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Goal } from "../../../../domain/goals/Goal.js";
import { GoalErrorMessages, formatErrorMessage } from "../../../../domain/goals/Constants.js";
import { GoalContextQueryHandler } from "../get/GoalContextQueryHandler.js";
import { ContextualGoalView } from "../get/ContextualGoalView.js";

/**
 * Handles refining a goal (marking it ready to be started).
 * Loads aggregate from event history, calls domain logic, persists event.
 * Refining does not require claims as it's a planning step before work begins.
 * Returns ContextualGoalView for presentation layer.
 */
export class RefineGoalCommandHandler {
  constructor(
    private readonly eventWriter: IGoalRefineEventWriter,
    private readonly eventReader: IGoalRefineEventReader,
    private readonly goalReader: IGoalRefineReader,
    private readonly eventBus: IEventBus,
    private readonly goalContextQueryHandler: GoalContextQueryHandler
  ) {}

  async execute(command: RefineGoalCommand): Promise<ContextualGoalView> {
    // 1. Check goal exists (query projection for fast check)
    const view = await this.goalReader.findById(command.goalId);
    if (!view) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.GOAL_NOT_FOUND, { id: command.goalId })
      );
    }

    // 2. Rehydrate aggregate from event history (event sourcing)
    const history = await this.eventReader.readStream(command.goalId);
    const goal = Goal.rehydrate(command.goalId, history as any);

    // 3. Domain logic produces event (validates state)
    const event = goal.refine();

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    // 6. Query goal context
    return this.goalContextQueryHandler.execute(command.goalId);
  }
}
