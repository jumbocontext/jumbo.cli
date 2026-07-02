import type { ComponentStatsView } from "./ComponentStatsView.js";
import type { DecisionStatsView } from "./DecisionStatsView.js";
import type { DependencyStatsView } from "./DependencyStatsView.js";
import type { GuidelineStatsView } from "./GuidelineStatsView.js";
import type { InvariantStatsView } from "./InvariantStatsView.js";

export type MemoryStatsView = {
  readonly decisions: DecisionStatsView;
  readonly components: ComponentStatsView;
  readonly dependencies: DependencyStatsView;
  readonly invariants: InvariantStatsView;
  readonly guidelines: GuidelineStatsView;
};
