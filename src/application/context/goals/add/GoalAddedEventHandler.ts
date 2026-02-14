import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { GoalAddedEvent } from "../../../../domain/goals/add/GoalAddedEvent.js";
import { IGoalAddedProjector } from "./IGoalAddedProjector.js";

/**
 * Event handler for GoalAddedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a new goal is added. Subscribes to GoalAddedEvent via event bus.
 */
export class GoalAddedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGoalAddedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const goalAddedEvent = event as GoalAddedEvent;
    await this.projector.applyGoalAdded(goalAddedEvent);
  }
}
