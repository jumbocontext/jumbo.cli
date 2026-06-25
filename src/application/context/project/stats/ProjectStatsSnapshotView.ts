import type { GraphStatsView } from "./GraphStatsView.js";
import type { MemoryStatsView } from "./MemoryStatsView.js";
import type { ProjectStatsView } from "./ProjectStatsView.js";
import type { WorkStatsView } from "./WorkStatsView.js";

export type ProjectStatsSnapshotView = {
  readonly project: ProjectStatsView;
  readonly work: WorkStatsView;
  readonly memory: MemoryStatsView;
  readonly graph: GraphStatsView;
};
