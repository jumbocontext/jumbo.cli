import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { GoalUnblockedEvent } from "../../../../domain/goals/unblock/GoalUnblockedEvent.js";
import { IGoalUnblockedProjector } from "./IGoalUnblockedProjector.js";

/**
 * Event handler for GoalUnblockedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a goal is unblocked. Subscribes to GoalUnblockedEvent via event bus.
 */
export class GoalUnblockedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGoalUnblockedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const goalUnblockedEvent = event as GoalUnblockedEvent;
    await this.projector.applyGoalUnblocked(goalUnblockedEvent);
  }
}
