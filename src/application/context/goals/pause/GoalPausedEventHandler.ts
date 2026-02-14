import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { GoalPausedEvent } from "../../../../domain/goals/pause/GoalPausedEvent.js";
import { IGoalPausedProjector } from "./IGoalPausedProjector.js";

/**
 * Event handler for GoalPausedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a goal is paused. Subscribes to GoalPausedEvent via event bus.
 */
export class GoalPausedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGoalPausedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const goalPausedEvent = event as GoalPausedEvent;
    await this.projector.applyGoalPaused(goalPausedEvent);
  }
}
