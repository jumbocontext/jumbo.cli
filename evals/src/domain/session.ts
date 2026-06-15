/**
 * A single agent interaction period within a run, plus the run-level record.
 * A SessionRecord captures everything observed during one harness exec: the
 * prompts, the produced files, token usage, Jumbo state snapshots, and timings.
 */

import type { JumboLifecycleAudit } from './jumbo-lifecycle.js';
import type { JumboMemorySnapshot } from './jumbo-memory.js';
import type { SessionPhaseTimings } from './timing.js';
import type { TamperEvent } from './tamper.js';
import type { WorkspaceSnapshot } from './workspace.js';

export interface SessionRecord {
  readonly id: string;
  readonly scenarioId: string;
  readonly sessionNumber: number;
  readonly harness: string;
  readonly variant?: 'jumbo' | 'baseline';
  readonly scenarioPrompt?: string;
  readonly effectivePrompt?: string;
  readonly deliveredContext?: string;
  readonly agentOutput: string;
  readonly filesModified: readonly string[];
  readonly transcript: string;
  readonly jumboLifecycleAudit?: JumboLifecycleAudit;
  readonly jumboMemorySnapshotBefore?: JumboMemorySnapshot;
  readonly jumboMemorySnapshot?: JumboMemorySnapshot;
  readonly workspaceSnapshot?: WorkspaceSnapshot;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly phaseTimings?: SessionPhaseTimings;
  readonly tampered: boolean;
  readonly tamperLog: readonly TamperEvent[];
}

export interface EvalRunRecord {
  readonly runId: string;
  readonly scenarioId: string;
  readonly harnesses: readonly string[];
  readonly sessionCount: number;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly status: 'running' | 'completed' | 'failed';
}

export function createSessionRecord(params: {
  id: string;
  scenarioId: string;
  sessionNumber: number;
  harness: string;
  variant?: 'jumbo' | 'baseline';
  scenarioPrompt?: string;
  effectivePrompt?: string;
  deliveredContext?: string;
  agentOutput: string;
  filesModified: readonly string[];
  transcript: string;
  jumboLifecycleAudit?: JumboLifecycleAudit;
  jumboMemorySnapshotBefore?: JumboMemorySnapshot;
  jumboMemorySnapshot?: JumboMemorySnapshot;
  workspaceSnapshot?: WorkspaceSnapshot;
  inputTokens?: number;
  outputTokens?: number;
  startedAt: string;
  completedAt: string;
  phaseTimings?: SessionPhaseTimings;
  tampered?: boolean;
  tamperLog?: readonly TamperEvent[];
}): SessionRecord {
  if (!params.id) throw new Error('SessionRecord requires an id');
  if (!params.scenarioId) throw new Error('SessionRecord requires a scenarioId');
  if (params.sessionNumber < 1) throw new Error('SessionRecord requires sessionNumber >= 1');
  if (!params.harness) throw new Error('SessionRecord requires a harness');

  return {
    ...params,
    tampered: params.tampered ?? false,
    tamperLog: params.tamperLog ?? [],
  };
}
