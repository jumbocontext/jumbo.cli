import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { GoalUpdatedEvent } from "../../../../domain/goals/update/GoalUpdatedEvent.js";
import { IGoalUpdatedProjector } from "./IGoalUpdatedProjector.js";

/**
 * Event handler for GoalUpdatedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a goal is updated. Subscribes to GoalUpdatedEvent via event bus.
 */
export class GoalUpdatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGoalUpdatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const goalUpdatedEvent = event as GoalUpdatedEvent;
    await this.projector.applyGoalUpdated(goalUpdatedEvent);
  }
}
