import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { GoalApprovedEvent } from "../../../../domain/goals/approve/GoalApprovedEvent.js";
import { IGoalApprovedProjector } from "./IGoalApprovedProjector.js";

/**
 * Event handler for GoalApprovedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a goal is approved. Subscribes to GoalApprovedEvent via event bus.
 */
export class GoalApprovedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGoalApprovedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const goalApprovedEvent = event as GoalApprovedEvent;
    await this.projector.applyGoalApproved(goalApprovedEvent);
  }
}
