export interface AddGoalRequest {
  readonly title: string;
  readonly objective: string;
  readonly successCriteria: string[];
  readonly scopeIn?: string[];
  readonly scopeOut?: string[];
  readonly nextGoalId?: string;
  readonly previousGoalId?: string;
  readonly prerequisiteGoals?: string[];
  readonly branch?: string;
  readonly worktree?: string;
}
