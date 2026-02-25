import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { GoalStatusMigratedEvent } from "../../../../domain/goals/migrate/GoalStatusMigratedEvent.js";
import { IGoalStatusMigratedProjector } from "./IGoalStatusMigratedProjector.js";

/**
 * Event handler for GoalStatusMigratedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a goal status is migrated from a legacy value. Subscribes to
 * GoalStatusMigratedEvent via event bus.
 */
export class GoalStatusMigratedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGoalStatusMigratedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const migratedEvent = event as GoalStatusMigratedEvent;
    await this.projector.applyGoalStatusMigrated(migratedEvent);
  }
}
