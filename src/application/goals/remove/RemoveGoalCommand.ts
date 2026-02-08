/**
 * Command to remove a goal from tracking.
 * The goal's history remains in the event store but will not appear in active queries.
 */
export interface RemoveGoalCommand {
  readonly goalId: string;
}
