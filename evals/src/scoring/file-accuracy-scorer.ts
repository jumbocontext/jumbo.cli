import type { SessionRecord, DimensionScore } from '../domain/types.js';

/**
 * Returns the set of modified files for a session record.
 * Uses harness-reported filesModified as the primary source.
 * Falls back to workspace snapshot file paths when the harness
 * did not report any modified files (e.g. adapter metadata missing).
 */
function getModifiedFiles(record: SessionRecord): readonly string[] {
  if (record.filesModified.length > 0) {
    return record.filesModified;
  }
  if (record.workspaceSnapshot && record.workspaceSnapshot.files.length > 0) {
    return record.workspaceSnapshot.files.map((f) => f.path);
  }
  return [];
}

/**
 * Whether every expected file was produced (recall === 1) across the given
 * sessions — one half of the token-efficiency output-equivalence gate
 * (GOAL.md "Comparing token usage fairly"). Vacuously true when no files are
 * expected. Independent of precision: extra files do not fail this check.
 */
export function producedAllExpectedFiles(
  sessionRecords: readonly SessionRecord[],
  expectedFiles: readonly string[],
): boolean {
  if (expectedFiles.length === 0) return true;
  const allModified = new Set(sessionRecords.flatMap((r) => getModifiedFiles(r)));
  return expectedFiles.every((expected) => allModified.has(expected));
}

/**
 * Pure deterministic scorer: compares files modified in a session
 * against the expected file list from the scenario.
 *
 * Score = F1(precision, recall) over expected vs. actual modified files.
 * Penalizes both missed files (low recall) and unexpected files (low precision).
 *
 * When a session's harness metadata is missing (filesModified empty), actual
 * workspace file paths from the snapshot are used as the fallback.
 */
export function scoreFileAccuracy(
  sessionRecords: readonly SessionRecord[],
  expectedFiles: readonly string[],
): DimensionScore {
  if (expectedFiles.length === 0) {
    return {
      dimension: 'file-accuracy',
      score: 1,
      maxScore: 1,
      details: 'No expected files defined — trivially satisfied',
    };
  }

  const allModified = new Set(
    sessionRecords.flatMap((r) => getModifiedFiles(r)),
  );

  const expectedSet = new Set(expectedFiles);

  let hits = 0;
  const missed: string[] = [];
  for (const expected of expectedSet) {
    if (allModified.has(expected)) {
      hits++;
    } else {
      missed.push(expected);
    }
  }

  const unexpected: string[] = [];
  for (const modified of allModified) {
    if (!expectedSet.has(modified)) {
      unexpected.push(modified);
    }
  }

  const precision = allModified.size > 0 ? hits / allModified.size : 0;
  const recall = hits / expectedSet.size;
  const f1 = precision + recall > 0
    ? (2 * precision * recall) / (precision + recall)
    : 0;

  const details = [
    `${hits}/${expectedSet.size} expected files modified`,
    missed.length > 0 ? `missed: ${missed.join(', ')}` : null,
    unexpected.length > 0 ? `unexpected: ${unexpected.join(', ')}` : null,
    `precision=${precision.toFixed(2)} recall=${recall.toFixed(2)} f1=${f1.toFixed(2)}`,
  ].filter(Boolean).join('; ');

  return {
    dimension: 'file-accuracy',
    score: Math.round(f1 * 100) / 100,
    maxScore: 1,
    details,
  };
}
