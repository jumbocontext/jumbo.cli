import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { GoalCodifyingStartedEvent } from "../../../../domain/goals/codify/GoalCodifyingStartedEvent.js";
import { IGoalCodifyingStartedProjector } from "./IGoalCodifyingStartedProjector.js";

/**
 * Event handler for GoalCodifyingStartedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a goal codify phase begins. Subscribes to GoalCodifyingStartedEvent via event bus.
 */
export class GoalCodifyingStartedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGoalCodifyingStartedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const goalCodifyingStartedEvent = event as GoalCodifyingStartedEvent;
    await this.projector.applyGoalCodifyingStarted(goalCodifyingStartedEvent);
  }
}
