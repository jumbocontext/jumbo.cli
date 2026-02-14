import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { GoalBlockedEvent } from "../../../../domain/goals/block/GoalBlockedEvent.js";
import { IGoalBlockedProjector } from "./IGoalBlockedProjector.js";

/**
 * Event handler for GoalBlockedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a goal is blocked. Subscribes to GoalBlockedEvent via event bus.
 */
export class GoalBlockedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGoalBlockedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const goalBlockedEvent = event as GoalBlockedEvent;
    await this.projector.applyGoalBlocked(goalBlockedEvent);
  }
}
