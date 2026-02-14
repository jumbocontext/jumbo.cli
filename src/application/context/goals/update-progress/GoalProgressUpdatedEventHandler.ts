import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { GoalProgressUpdatedEvent } from "../../../../domain/goals/update-progress/GoalProgressUpdatedEvent.js";
import { IGoalProgressUpdatedProjector } from "./IGoalProgressUpdatedProjector.js";

/**
 * Event handler for GoalProgressUpdatedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when goal progress is updated. Subscribes to GoalProgressUpdatedEvent via event bus.
 */
export class GoalProgressUpdatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGoalProgressUpdatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const goalProgressUpdatedEvent = event as GoalProgressUpdatedEvent;
    await this.projector.applyGoalProgressUpdated(goalProgressUpdatedEvent);
  }
}
