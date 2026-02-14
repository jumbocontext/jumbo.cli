import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { GoalRefinedEvent } from "../../../../domain/goals/refine/GoalRefinedEvent.js";
import { IGoalRefinedProjector } from "./IGoalRefinedProjector.js";

/**
 * Event handler for GoalRefinedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a goal is refined. Subscribes to GoalRefinedEvent via event bus.
 */
export class GoalRefinedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGoalRefinedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const goalRefinedEvent = event as GoalRefinedEvent;
    await this.projector.applyGoalRefined(goalRefinedEvent);
  }
}
