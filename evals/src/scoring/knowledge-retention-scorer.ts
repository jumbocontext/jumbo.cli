import type { SessionRecord, DimensionScore } from '../domain/types.js';

/**
 * Builds the search corpus for a session record.
 * If a workspace snapshot is available its file contents are used as the
 * primary (and sole) evidence — this catches correct code with terse transcripts
 * and rejects keyword-only transcripts that don't reflect real implementation.
 * Falls back to agentOutput + transcript + filesModified when no snapshot exists.
 */
function buildSearchText(record: SessionRecord): string {
  if (record.workspaceSnapshot && record.workspaceSnapshot.files.length > 0) {
    return [
      ...record.workspaceSnapshot.files.map((f) => f.content),
      ...record.workspaceSnapshot.files.map((f) => f.path),
    ].join('\n').toLowerCase();
  }

  return [
    record.agentOutput,
    record.transcript,
    ...record.filesModified,
  ].join('\n').toLowerCase();
}

/**
 * Pure deterministic scorer: checks whether patterns established in early
 * sessions persist through later sessions.
 *
 * retentionPatterns are strings (file names, code patterns, identifiers)
 * that should appear in the workspace across all sessions. When a workspace
 * snapshot is available, file contents are the primary evidence; otherwise
 * falls back to transcript and agent output.
 *
 * Score = fraction of patterns still evident in the latest session.
 */
export function scoreKnowledgeRetention(
  sessionRecords: readonly SessionRecord[],
  retentionPatterns: readonly string[],
): DimensionScore {
  if (retentionPatterns.length === 0 || sessionRecords.length === 0) {
    return {
      dimension: 'knowledge-retention',
      score: 1,
      maxScore: 1,
      details: retentionPatterns.length === 0
        ? 'No retention patterns defined — trivially satisfied'
        : 'No session records to evaluate',
    };
  }

  const latestSession = sessionRecords.reduce((latest, r) =>
    r.sessionNumber > latest.sessionNumber ? r : latest,
  );

  const searchText = buildSearchText(latestSession);

  let retained = 0;
  const lost: string[] = [];

  for (const pattern of retentionPatterns) {
    if (searchText.includes(pattern.toLowerCase())) {
      retained++;
    } else {
      lost.push(pattern);
    }
  }

  const score = retained / retentionPatterns.length;

  const details = [
    `${retained}/${retentionPatterns.length} patterns retained in session ${latestSession.sessionNumber}`,
    lost.length > 0 ? `lost: ${lost.join(', ')}` : null,
  ].filter(Boolean).join('; ');

  return {
    dimension: 'knowledge-retention',
    score: Math.round(score * 100) / 100,
    maxScore: 1,
    details,
  };
}

/**
 * Scores knowledge retention per-session to produce a trajectory.
 * Returns one DimensionScore per session, showing how retention
 * degrades (or holds) over time.
 */
export function scoreKnowledgeRetentionTimeline(
  sessionRecords: readonly SessionRecord[],
  retentionPatterns: readonly string[],
): DimensionScore[] {
  if (retentionPatterns.length === 0) return [];

  const sorted = [...sessionRecords].sort((a, b) => a.sessionNumber - b.sessionNumber);

  return sorted.map((record) => {
    const searchText = buildSearchText(record);

    let retained = 0;
    for (const pattern of retentionPatterns) {
      if (searchText.includes(pattern.toLowerCase())) {
        retained++;
      }
    }

    const score = retained / retentionPatterns.length;

    return {
      dimension: 'knowledge-retention',
      score: Math.round(score * 100) / 100,
      maxScore: 1,
      details: `session ${record.sessionNumber}: ${retained}/${retentionPatterns.length} retained`,
    };
  });
}
