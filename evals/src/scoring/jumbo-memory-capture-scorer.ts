import type {
  DimensionScore,
  ExpectedJumboMemoryCapture,
  JumboMemoryEntity,
  JumboMemorySnapshot,
  SessionRecord,
} from '../domain/types.js';

const DIMENSION = 'jumbo-memory-capture';

export interface JumboMemoryCaptureEvidence {
  readonly expected: ExpectedJumboMemoryCapture;
  readonly matched: boolean;
  readonly observed?: JumboMemoryEntity;
  readonly observedSessionNumber?: number;
}

interface NewEntity {
  readonly entity: JumboMemoryEntity;
  readonly sessionNumber: number;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function entityKey(entity: JumboMemoryEntity): string {
  return entity.id
    ? `${entity.kind}:id:${entity.id}`
    : `${entity.kind}:${normalize(entity.text)}`;
}

function snapshotKeys(snapshot: JumboMemorySnapshot | undefined): Set<string> {
  const keys = new Set<string>();
  if (!snapshot) return keys;
  for (const entity of snapshot.entities) {
    keys.add(entityKey(entity));
  }
  return keys;
}

/**
 * Computes the entities the agent registered during a single session window:
 * the diff between the pre-session and post-session Jumbo memory snapshots
 * taken inside the run. Entities present in `jumboMemorySnapshot` but absent
 * from `jumboMemorySnapshotBefore` are credited to that session.
 *
 * The pre-snapshot may be undefined for legacy records — in that case the
 * full post-snapshot is treated as new. New records always carry both.
 */
function newEntitiesForRecord(record: SessionRecord): JumboMemoryEntity[] {
  const post = record.jumboMemorySnapshot;
  if (!post) return [];
  const beforeKeys = snapshotKeys(record.jumboMemorySnapshotBefore);
  const seen = new Set<string>();
  const result: JumboMemoryEntity[] = [];
  for (const entity of post.entities) {
    const key = entityKey(entity);
    if (beforeKeys.has(key)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entity);
  }
  return result;
}

function collectNewEntities(records: readonly SessionRecord[]): NewEntity[] {
  const all: NewEntity[] = [];
  const seen = new Set<string>();
  for (const record of records) {
    for (const entity of newEntitiesForRecord(record)) {
      const key = entityKey(entity);
      if (seen.has(key)) continue;
      seen.add(key);
      all.push({ entity, sessionNumber: record.sessionNumber });
    }
  }
  return all;
}

function matchesExpectation(
  entity: JumboMemoryEntity,
  expected: ExpectedJumboMemoryCapture,
): boolean {
  return entity.kind === expected.kind && normalize(entity.text).includes(normalize(expected.match));
}

/**
 * Counts entities the agent actually registered during the session windows
 * — measured as the diff between pre and post snapshots inside the run, not
 * as harness-side mirroring. Recall measures expected captures that appear
 * in the diff. Precision measures observed new entities that correspond to
 * expectations among the relevant kinds.
 */
export function scoreJumboMemoryCapture(
  records: readonly SessionRecord[],
  expectedCaptures: readonly ExpectedJumboMemoryCapture[],
): DimensionScore {
  if (expectedCaptures.length === 0) {
    return {
      dimension: DIMENSION,
      score: 1,
      maxScore: 1,
      details: 'No expected Jumbo memory captures; trivially satisfied.',
    };
  }

  const newEntities = collectNewEntities(records);
  const relevantNewEntities = newEntities.filter((ne) =>
    expectedCaptures.some((expected) => expected.kind === ne.entity.kind),
  );

  const matchedEntityKeys = new Set<string>();
  const evidence: JumboMemoryCaptureEvidence[] = expectedCaptures.map((expected) => {
    const eligible = expected.sessionNumber !== undefined
      ? newEntities.filter((ne) => ne.sessionNumber >= expected.sessionNumber!)
      : newEntities;
    const observed = eligible.find((ne) => matchesExpectation(ne.entity, expected));
    if (observed) matchedEntityKeys.add(entityKey(observed.entity));
    return {
      expected,
      matched: observed !== undefined,
      observed: observed?.entity,
      observedSessionNumber: observed?.sessionNumber,
    };
  });

  const matched = evidence.filter((item) => item.matched);
  const recall = matched.length / expectedCaptures.length;
  const precision = relevantNewEntities.length === 0
    ? (matched.length === 0 ? 0 : 1)
    : relevantNewEntities.filter((ne) => matchedEntityKeys.has(entityKey(ne.entity))).length /
      relevantNewEntities.length;
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  const missing = evidence
    .filter((item) => !item.matched)
    .map((item) => `${item.expected.kind}:${item.expected.match}`);
  const spurious = relevantNewEntities
    .filter((ne) => !matchedEntityKeys.has(entityKey(ne.entity)))
    .map((ne) => `${ne.entity.kind}:${ne.entity.text}`);

  return {
    dimension: DIMENSION,
    score: Math.round(f1 * 100) / 100,
    maxScore: 1,
    details: [
      `precision=${precision.toFixed(2)}`,
      `recall=${recall.toFixed(2)}`,
      `matched=${matched.length}/${expectedCaptures.length}`,
      `new-entities=${newEntities.length}`,
      missing.length > 0 ? `missing: ${missing.join('; ')}` : 'missing: none',
      spurious.length > 0 ? `spurious: ${spurious.join('; ')}` : 'spurious: none',
    ].join('; '),
  };
}

export function baselineJumboMemoryCaptureScore(
  expectedCaptures: readonly ExpectedJumboMemoryCapture[],
): DimensionScore {
  return {
    dimension: DIMENSION,
    score: 0,
    maxScore: 0,
    details: expectedCaptures.length > 0
      ? 'Not applicable: baseline runs do not use Jumbo project memory.'
      : 'Not applicable: no expected Jumbo memory captures.',
  };
}

export function scoreJumboMemoryCaptureTimeline(
  records: readonly SessionRecord[],
  expectedCaptures: readonly ExpectedJumboMemoryCapture[],
): DimensionScore[] {
  return records.map((record) =>
    scoreJumboMemoryCapture(
      records.filter((candidate) => candidate.sessionNumber <= record.sessionNumber),
      expectedCaptures.filter((capture) => !capture.sessionNumber || capture.sessionNumber <= record.sessionNumber),
    ),
  );
}
