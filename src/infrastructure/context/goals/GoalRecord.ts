/**
 * GoalRecord - Infrastructure-layer type representing a raw SQLite row
 * from the goal_views table.
 *
 * Array fields are stored as JSON strings. Optional fields are nullable.
 * Use GoalRecordMapper to convert to the application-layer GoalView.
 */

export interface GoalRecord {
  readonly id: string;
  readonly title: string;
  readonly objective: string;
  readonly successCriteria: string; // JSON array
  readonly scopeIn: string; // JSON array
  readonly scopeOut: string; // JSON array
  readonly status: string;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly note: string | null;
  readonly progress: string; // JSON array
  readonly claimedBy: string | null;
  readonly claimedAt: string | null;
  readonly claimExpiresAt: string | null;
  readonly nextGoalId: string | null;
  readonly prerequisiteGoals: string | null; // JSON array
}
