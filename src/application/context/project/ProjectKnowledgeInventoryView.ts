/**
 * ProjectKnowledgeInventoryView - Lean read model for lifecycle classification.
 *
 * Counts are derived from existing projections and do not represent mutable
 * lifecycle state.
 */
export interface ProjectKnowledgeInventoryView {
  readonly projectInitialized: boolean;
  readonly solutionContextItemCount: number;
  readonly launchpadReadyGoalCount: number;
}
