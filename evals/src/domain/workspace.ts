/**
 * A captured snapshot of user-authored workspace files. The structural-assertion
 * scorer evaluates retention against these artefacts.
 */

export interface WorkspaceFileEntry {
  readonly path: string;
  readonly content: string;
}

/**
 * A content-free summary of Jumbo's own event log (`.jumbo/events/`), captured
 * as scoring evidence (GOAL.md §"Workspace evidence: capturing `.jumbo/`").
 * The event log is the ground truth of what happened inside Jumbo; CLI command
 * outputs are a derived view. Full event content is not required — file names
 * and aggregate counts by event type are sufficient to verify that the agent
 * registered entities during the session.
 *
 * Jumbo stores events as `.jumbo/events/<aggregateId>/<seq>.<EventType>.json`,
 * so `countsByType` is keyed by the event type parsed from the file name (the
 * stable, reproducible signal); aggregate ids are non-deterministic across runs
 * and appear only in `fileNames` as an audit trail.
 */
export interface JumboEventSummary {
  readonly capturedAt: string;
  readonly aggregateCount: number;
  readonly eventCount: number;
  readonly countsByType: Readonly<Record<string, number>>;
  readonly fileNames: readonly string[];
}

export interface WorkspaceSnapshot {
  readonly capturedAt: string;
  readonly files: readonly WorkspaceFileEntry[];
  readonly jumboEvents?: JumboEventSummary;
}
