import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { GoalQualifiedEvent } from "../../../../domain/goals/qualify/GoalQualifiedEvent.js";
import { IGoalQualifiedProjector } from "./IGoalQualifiedProjector.js";

/**
 * Event handler for GoalQualifiedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a goal is qualified. Subscribes to GoalQualifiedEvent via event bus.
 */
export class GoalQualifiedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGoalQualifiedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const goalQualifiedEvent = event as GoalQualifiedEvent;
    await this.projector.applyGoalQualified(goalQualifiedEvent);
  }
}
