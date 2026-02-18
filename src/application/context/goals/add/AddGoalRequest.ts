export interface AddGoalRequest {
  readonly objective: string;
  readonly successCriteria: string[];
  readonly scopeIn?: string[];
  readonly scopeOut?: string[];
  readonly nextGoalId?: string;
  readonly previousGoalId?: string;
}
