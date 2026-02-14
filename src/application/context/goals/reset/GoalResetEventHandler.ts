import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { GoalResetEvent } from "../../../../domain/goals/reset/GoalResetEvent.js";
import { IGoalResetProjector } from "./IGoalResetProjector.js";

/**
 * Event handler for GoalResetEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a goal is reset. Subscribes to GoalResetEvent via event bus.
 */
export class GoalResetEventHandler implements IEventHandler {
  constructor(private readonly projector: IGoalResetProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const goalResetEvent = event as GoalResetEvent;
    await this.projector.applyGoalReset(goalResetEvent);
  }
}
