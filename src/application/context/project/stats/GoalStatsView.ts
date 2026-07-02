import type { ClosedGoalsCount } from "./ClosedGoalsCount.js";
import type { DefinedGoalsCount } from "./DefinedGoalsCount.js";
import type { InProgressGoalsCount } from "./InProgressGoalsCount.js";
import type { RefinedGoalsCount } from "./RefinedGoalsCount.js";
import type { SubmittedGoalsCount } from "./SubmittedGoalsCount.js";

export type GoalStatsView = {
  readonly definedGoalsCount: DefinedGoalsCount;
  readonly refinedGoalsCount: RefinedGoalsCount;
  readonly inProgressGoalsCount: InProgressGoalsCount;
  readonly submittedGoalsCount: SubmittedGoalsCount;
  readonly closedGoalsCount: ClosedGoalsCount;
};
