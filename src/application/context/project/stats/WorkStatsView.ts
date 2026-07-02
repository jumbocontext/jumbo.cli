import type { GoalStatsView } from "./GoalStatsView.js";
import type { SessionsStatsView } from "./SessionsStatsView.js";

export type WorkStatsView = {
  readonly goals: GoalStatsView;
  readonly sessions: SessionsStatsView;
};
