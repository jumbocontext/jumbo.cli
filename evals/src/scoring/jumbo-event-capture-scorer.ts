import type {
  DimensionScore,
  ExpectedJumboMemoryCapture,
  JumboMemoryKind,
  SessionRecord,
} from '../domain/types.js';

/**
 * Secondary, non-CLI-mediated confirmation that the Jumbo arm registered the
 * expected entities (GOAL.md "Workspace evidence: capturing .jumbo/"). Where
 * the primary jumbo-memory-capture scorer reads the CLI-derived memory
 * snapshot, this scorer reads only the captured `.jumbo/events/` summary on the
 * workspace snapshot — the event log is Jumbo's own ground truth, independent
 * of any CLI command output.
 */
const DIMENSION = 'jumbo-event-capture';

/**
 * Explicit, exhaustive registry from a memory kind to the Jumbo domain event
 * its registration emits. `satisfies Record<JumboMemoryKind, string>` makes the
 * compiler reject a new JumboMemoryKind until it is mapped here, and pins the
 * exact event-type spelling rather than deriving it from a naming convention.
 *
 * These literals mirror Jumbo's domain event-type constants
 * (DecisionEventType.ADDED, ComponentEventType.ADDED, …). evals is a separate
 * package and cannot import those constants at compile time, so the
 * jumbo-contract-smoke validates this map against the real CLI at CI time — if
 * Jumbo renames an event type, the smoke fails loudly instead of the scorer
 * silently under-counting.
 */
export const addedEventTypeByKind = {
  decision: 'DecisionAddedEvent',
  guideline: 'GuidelineAddedEvent',
  invariant: 'InvariantAddedEvent',
  component: 'ComponentAddedEvent',
  relation: 'RelationAddedEvent',
  dependency: 'DependencyAddedEvent',
} as const satisfies Record<JumboMemoryKind, string>;

/**
 * Resolves the *Added*-event type for a memory kind, e.g. 'decision' ->
 * 'DecisionAddedEvent'. This scorer confirms initial registration (capture),
 * so it maps only to the Added event — not Updated/Removed/Reversed/etc.
 */
export function resolveAddedEventTypeForKind(kind: JumboMemoryKind): string {
  return addedEventTypeByKind[kind];
}

/** The event-type counts from the latest session that carries an event-log summary. */
function latestEventCounts(records: readonly SessionRecord[]): Readonly<Record<string, number>> | undefined {
  let latest: SessionRecord | undefined;
  for (const record of records) {
    if (!record.workspaceSnapshot?.jumboEvents) continue;
    if (!latest || record.sessionNumber > latest.sessionNumber) latest = record;
  }
  return latest?.workspaceSnapshot?.jumboEvents?.countsByType;
}

/**
 * Fraction of the distinct expected entity kinds whose corresponding Jumbo
 * event type appears (count >= 1) in the latest session's event-log summary.
 * Trivially satisfied when no captures are expected.
 */
export function scoreJumboEventCapture(
  records: readonly SessionRecord[],
  expectedCaptures: readonly ExpectedJumboMemoryCapture[],
): DimensionScore {
  if (expectedCaptures.length === 0) {
    return {
      dimension: DIMENSION,
      score: 1,
      maxScore: 1,
      details: 'No expected Jumbo captures; trivially satisfied.',
    };
  }

  const expectedKinds = [...new Set(expectedCaptures.map((c) => c.kind))];
  const counts = latestEventCounts(records) ?? {};

  const present: string[] = [];
  const missing: string[] = [];
  for (const kind of expectedKinds) {
    const eventType = resolveAddedEventTypeForKind(kind);
    if ((counts[eventType] ?? 0) >= 1) present.push(eventType);
    else missing.push(eventType);
  }

  const score = present.length / expectedKinds.length;
  return {
    dimension: DIMENSION,
    score: Math.round(score * 100) / 100,
    maxScore: 1,
    details: [
      `${present.length}/${expectedKinds.length} expected entity kinds evidenced in .jumbo/events`,
      missing.length > 0 ? `missing: ${missing.join(', ')}` : 'missing: none',
    ].join('; '),
  };
}

/**
 * Baseline arm has no `.jumbo/events/` log — there is nothing to confirm.
 * Reported as a trivial zero (maxScore 0), mirroring baselineJumboMemoryCaptureScore.
 */
export function baselineJumboEventCaptureScore(
  expectedCaptures: readonly ExpectedJumboMemoryCapture[],
): DimensionScore {
  return {
    dimension: DIMENSION,
    score: 0,
    maxScore: 0,
    details: expectedCaptures.length > 0
      ? 'Not applicable: baseline runs have no .jumbo/events log.'
      : 'Not applicable: no expected Jumbo captures.',
  };
}

/** Per-session trajectory: the event-capture score cumulative to each session. */
export function scoreJumboEventCaptureTimeline(
  records: readonly SessionRecord[],
  expectedCaptures: readonly ExpectedJumboMemoryCapture[],
): DimensionScore[] {
  return records.map((record) =>
    scoreJumboEventCapture(
      records.filter((candidate) => candidate.sessionNumber <= record.sessionNumber),
      expectedCaptures.filter((capture) => !capture.sessionNumber || capture.sessionNumber <= record.sessionNumber),
    ),
  );
}
