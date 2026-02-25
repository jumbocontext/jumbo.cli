/**
 * Response from the upgrade command.
 */
export interface UpgradeResponse {
  readonly migratedGoals: number;
  readonly eventsAppended: number;
  readonly success: boolean;
}
