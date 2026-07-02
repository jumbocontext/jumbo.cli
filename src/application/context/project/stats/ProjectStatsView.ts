import type { AudiencePainStatsView } from "./AudiencePainStatsView.js";
import type { AudienceStatsView } from "./AudienceStatsView.js";
import type { ValuePropositionsStatsView } from "./ValuePropositionsStatsView.js";

export type ProjectStatsView = {
  readonly audiences: AudienceStatsView;
  readonly audiencePains: AudiencePainStatsView;
  readonly valuePropositions: ValuePropositionsStatsView;
};
