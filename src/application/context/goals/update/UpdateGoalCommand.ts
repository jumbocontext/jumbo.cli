/**
 * Command to update an existing goal's properties.
 * Only provided fields will be updated; omitted fields remain unchanged.
 */
export interface UpdateGoalCommand {
  readonly goalId: string;
  readonly title?: string;
  readonly objective?: string;
  readonly successCriteria?: string[];
  readonly scopeIn?: string[];
  readonly scopeOut?: string[];
  readonly nextGoalId?: string;
  readonly prerequisiteGoals?: string[];
  readonly branch?: string;
  readonly worktree?: string;
}
