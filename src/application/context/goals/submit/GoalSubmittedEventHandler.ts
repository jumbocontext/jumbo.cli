import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { GoalSubmittedEvent } from "../../../../domain/goals/submit/GoalSubmittedEvent.js";
import { IGoalSubmittedProjector } from "./IGoalSubmittedProjector.js";

/**
 * Event handler for GoalSubmittedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a goal is submitted. Subscribes to GoalSubmittedEvent via event bus.
 */
export class GoalSubmittedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGoalSubmittedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const goalSubmittedEvent = event as GoalSubmittedEvent;
    await this.projector.applyGoalSubmitted(goalSubmittedEvent);
  }
}
