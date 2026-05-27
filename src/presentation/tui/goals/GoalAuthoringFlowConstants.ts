export const GoalAuthoringStage = {
  DETAILS: "details",
  CRITERIA: "criteria",
  SCOPE: "scope",
  SEQUENCING: "sequencing",
  WORKSPACE: "workspace",
} as const;

export type GoalAuthoringStageValue =
  (typeof GoalAuthoringStage)[keyof typeof GoalAuthoringStage];

export const GoalAuthoringFieldKey = {
  TITLE: "title",
  OBJECTIVE: "objective",
  SCOPE_IN: "scopeIn",
  SCOPE_OUT: "scopeOut",
  PREVIOUS_GOAL: "previousGoal",
  NEXT_GOAL: "nextGoal",
  PREREQUISITE_GOALS: "prerequisiteGoals",
  BRANCH: "branch",
  WORKTREE: "worktree",
  CRITERION: "criterion",
  ADD_ANOTHER_CRITERION: "addAnotherCriterion",
} as const;

export const GoalAuthoringCopy = {
  title: "Author Goal",
  details: {
    title: "Goal Details",
    description:
      "Name the goal and state the single outcome it should accomplish.",
    fields: {
      title: "Title",
      objective: "Objective",
      titlePlaceholder: "e.g. Wire Cockpit goal authoring",
      objectivePlaceholder: "e.g. Prototype the Goals screen",
    },
  },
  scope: {
    title: "Scope",
    description:
      "Identify the work area and boundaries that keep the goal focused.",
    fields: {
      scopeIn: "Scope in (optional)",
      scopeOut: "Scope out (optional)",
      scopeInPlaceholder: "e.g. src/presentation/tui/goals",
      scopeOutPlaceholder: "e.g. src/application",
    },
  },
  sequencing: {
    title: "Goal Sequence",
    description:
      "Optionally chain this goal to other goals or define prerequisites.",
    fields: {
      previousGoal: "Previous goal (optional)",
      nextGoal: "Next goal (optional)",
      prerequisiteGoals: "Prerequisite goals (optional)",
      previousGoalPlaceholder: "e.g. goal_123",
      nextGoalPlaceholder: "e.g. goal_456",
      prerequisiteGoalsPlaceholder: "e.g. goal_a goal_b",
    },
  },
  workspace: {
    title: "Workspace",
    description:
      "Optionally reserve a branch or worktree for multi-agent collaboration.",
    fields: {
      branch: "Branch (optional)",
      worktree: "Worktree (optional)",
      branchPlaceholder: "e.g. feature/cockpit-goal-authoring",
      worktreePlaceholder: "e.g. ../jumbo-cockpit-goal-authoring",
    },
  },
  criteria: {
    titlePrefix: "Criterion",
    description:
      "Define one measurable success criterion so review can determine completion.",
    successCriterion: "Success criterion",
    successCriterionPlaceholder:
      "e.g. List renders status, detail, and action hints",
    addAnotherCriterion: "Add another criterion?",
  },
} as const;

export const GoalAuthoringCriterionValue = {
  YES: "yes",
  NO: "no",
} as const;

export const AUTHORING_PROGRESS_LABELS: Readonly<
  Record<GoalAuthoringStageValue, string>
> = {
  [GoalAuthoringStage.DETAILS]: "1/5",
  [GoalAuthoringStage.CRITERIA]: "2/5",
  [GoalAuthoringStage.SCOPE]: "3/5",
  [GoalAuthoringStage.SEQUENCING]: "4/5",
  [GoalAuthoringStage.WORKSPACE]: "5/5",
};
