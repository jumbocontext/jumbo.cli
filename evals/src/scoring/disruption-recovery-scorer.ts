import type { SessionRecord, DimensionScore } from '../domain/types.js';
import type { Disruption } from '../domain/types.js';

/**
 * Builds the search corpus for a session record.
 * If a workspace snapshot is available its file contents are the primary evidence,
 * catching cases where recovery patterns are actually implemented in code rather
 * than merely mentioned in transcripts.
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
 * Pure deterministic scorer: checks whether disruption corrections
 * persist in sessions after the disruption was injected.
 *
 * For each disruption, checks its recoveryPatterns in all sessions
 * AFTER the injection session. A correction that persists means the
 * agent retained the correction. A correction that disappears after
 * a session boundary signals amnesia.
 *
 * When a workspace snapshot is available, post-disruption workspace
 * file contents are the primary evidence; transcript is the fallback.
 *
 * Score = fraction of (disruption, post-session) pairs where recovery
 * patterns are found.
 */
export function scoreDisruptionRecovery(
  sessionRecords: readonly SessionRecord[],
  disruptions: readonly Disruption[],
): DimensionScore {
  if (disruptions.length === 0) {
    return {
      dimension: 'disruption-recovery',
      score: 1,
      maxScore: 1,
      details: 'No disruptions defined — trivially satisfied',
    };
  }

  const sorted = [...sessionRecords].sort((a, b) => a.sessionNumber - b.sessionNumber);
  let totalChecks = 0;
  let recoveredChecks = 0;
  const failures: string[] = [];

  for (const disruption of disruptions) {
    if (disruption.recoveryPatterns.length === 0) continue;

    const postSessions = sorted.filter((r) => r.sessionNumber > disruption.sessionNumber);
    if (postSessions.length === 0) continue;

    for (const session of postSessions) {
      const searchText = buildSearchText(session);

      for (const pattern of disruption.recoveryPatterns) {
        totalChecks++;
        if (searchText.includes(pattern.toLowerCase())) {
          recoveredChecks++;
        } else {
          failures.push(`session ${session.sessionNumber}: lost "${pattern}" from ${disruption.type} @ session ${disruption.sessionNumber}`);
        }
      }
    }
  }

  if (totalChecks === 0) {
    return {
      dimension: 'disruption-recovery',
      score: 1,
      maxScore: 1,
      details: 'No recovery checks applicable (no post-disruption sessions or no recovery patterns)',
    };
  }

  const score = recoveredChecks / totalChecks;

  const details = [
    `${recoveredChecks}/${totalChecks} recovery checks passed`,
    failures.length > 0 ? `failures: ${failures.slice(0, 5).join('; ')}${failures.length > 5 ? ` (+${failures.length - 5} more)` : ''}` : null,
  ].filter(Boolean).join('; ');

  return {
    dimension: 'disruption-recovery',
    score: Math.round(score * 100) / 100,
    maxScore: 1,
    details,
  };
}

/**
 * Per-session disruption recovery timeline.
 * Returns one score per session showing recovery status at that point.
 */
export function scoreDisruptionRecoveryTimeline(
  sessionRecords: readonly SessionRecord[],
  disruptions: readonly Disruption[],
): DimensionScore[] {
  if (disruptions.length === 0) return [];

  const sorted = [...sessionRecords].sort((a, b) => a.sessionNumber - b.sessionNumber);

  return sorted.map((session) => {
    const activeDisruptions = disruptions.filter((d) => d.sessionNumber < session.sessionNumber);

    if (activeDisruptions.length === 0) {
      return {
        dimension: 'disruption-recovery',
        score: 1,
        maxScore: 1,
        details: `session ${session.sessionNumber}: no active disruptions yet`,
      };
    }

    const searchText = buildSearchText(session);

    let totalPatterns = 0;
    let found = 0;

    for (const d of activeDisruptions) {
      for (const pattern of d.recoveryPatterns) {
        totalPatterns++;
        if (searchText.includes(pattern.toLowerCase())) {
          found++;
        }
      }
    }

    const score = totalPatterns > 0 ? found / totalPatterns : 1;

    return {
      dimension: 'disruption-recovery',
      score: Math.round(score * 100) / 100,
      maxScore: 1,
      details: `session ${session.sessionNumber}: ${found}/${totalPatterns} recovery patterns present`,
    };
  });
}
