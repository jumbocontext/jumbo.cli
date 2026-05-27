import { GoalStatus } from "../../../domain/goals/Constants.js";

export const GOAL_STATUS_FILTER_ALL = "all";

export const GOAL_STATUS_FILTERS = [
  GOAL_STATUS_FILTER_ALL,
  GoalStatus.TODO,
  GoalStatus.REFINED,
  GoalStatus.DOING,
  GoalStatus.BLOCKED,
  GoalStatus.INREVIEW,
  GoalStatus.DONE,
] as const;

export type GoalStatusFilter = (typeof GOAL_STATUS_FILTERS)[number];

export const GoalsScreenCopy = {
  listTitle: "Goal List",
  detailTitle: "Goal Detail",
  loadingGoals: "Loading goals",
  emptyGoals: "No goals available",
  emptyFieldValue: "None",
  actionHintsTitle: "Action Hints",
  details: {
    id: "ID",
    title: "Title",
    status: "Status",
    objective: "Objective",
    criteria: "Criteria",
    scopeIn: "Scope in",
    scopeOut: "Scope out",
    prerequisites: "Prerequisites",
    progress: "Progress",
    note: "Note",
    reviewIssues: "Review issues",
    nextGoal: "Next goal",
  },
  shortcuts: {
    author: "author",
    select: "select",
    filter: "filter",
  },
} as const;

export const GOAL_DETAIL_JOIN_SEPARATOR = "\n";
export const GOAL_TUMBLER_MAX_DISPLAY_LENGTH = 44;
