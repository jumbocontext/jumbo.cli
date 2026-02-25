import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { GoalClosedEvent } from "../../../../domain/goals/close/GoalClosedEvent.js";
import { IGoalClosedProjector } from "./IGoalClosedProjector.js";

/**
 * Event handler for GoalClosedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a goal is closed. Subscribes to GoalClosedEvent via event bus.
 */
export class GoalClosedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGoalClosedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const goalClosedEvent = event as GoalClosedEvent;
    await this.projector.applyGoalClosed(goalClosedEvent);
  }
}
