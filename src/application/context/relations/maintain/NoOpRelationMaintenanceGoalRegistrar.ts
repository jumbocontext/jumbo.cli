import { IRelationMaintenanceGoalRegistrar } from "./IRelationMaintenanceGoalRegistrar.js";

/**
 * No-op implementation used during database rebuild (event replay).
 * Event replay must not produce side-effects like creating new goals.
 */
export class NoOpRelationMaintenanceGoalRegistrar implements IRelationMaintenanceGoalRegistrar {
  async execute(): Promise<null> {
    return null;
  }
}
