import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { GoalResumedEvent } from "../../../../domain/goals/resume/GoalResumedEvent.js";
import { IGoalResumedProjector } from "./IGoalResumedProjector.js";

/**
 * Event handler for GoalResumedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a goal is resumed. Subscribes to GoalResumedEvent via event bus.
 */
export class GoalResumedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGoalResumedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const goalResumedEvent = event as GoalResumedEvent;
    await this.projector.applyGoalResumed(goalResumedEvent);
  }
}
