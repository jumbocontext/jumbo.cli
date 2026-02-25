import { GoalStatusMigratedEvent } from "../../../../domain/goals/migrate/GoalStatusMigratedEvent.js";

/**
 * Port interface for projecting GoalStatusMigratedEvent to the read model.
 * Used by GoalStatusMigratedEventHandler to update the projection store.
 */
export interface IGoalStatusMigratedProjector {
  applyGoalStatusMigrated(event: GoalStatusMigratedEvent): Promise<void>;
}
