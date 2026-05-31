import { GoalStatusType } from "../../../../domain/goals/Constants.js";

export interface GoalBacklogPreviewItem {
  readonly goalId: string;
  readonly title: string;
  readonly status: GoalStatusType;
  readonly createdAt: string;
}
