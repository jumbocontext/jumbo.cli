import { randomUUID } from 'node:crypto';
import type { TestScenario, ComparisonResult, SessionRecord, PerSessionScore, JumboLifecycleAudit, JumboLifecycleCommandResult, JumboLifecycleEvidence, JumboMemoryCommandResult, JumboMemoryEntity, JumboMemoryKind, JumboMemorySnapshot, SessionHeartbeat, SessionPhaseTimings, TimingSpan, TamperEvent, RunControlFile, JumboPlan, JumboPlanEntry, JumboPlanGoal } from './domain/types.js';
import { createTestResult, createComparisonResult } from './domain/types.js';
import type { ResultStore } from './storage/result-store.js';
import { LocalExecutor } from './infrastructure/local-executor.js';
import type { HeartbeatWriter } from './infrastructure/heartbeat-writer.js';
import { buildHeartbeatUpdate } from './infrastructure/heartbeat-writer.js';
import type { ExecResult } from './infrastructure/container-manager.js';
import type { HarnessAdapter } from './harness/harness-adapter.js';
import { runSession } from './run-session.js';
import { scoreFileAccuracy } from './scoring/file-accuracy-scorer.js';
import { scoreKnowledgeRetention, scoreKnowledgeRetentionTimeline } from './scoring/knowledge-retention-scorer.js';
import { scoreDisruptionRecovery, scoreDisruptionRecoveryTimeline } from './scoring/disruption-recovery-scorer.js';
import { baselineJumboMemoryCaptureScore, scoreJumboMemoryCapture, scoreJumboMemoryCaptureTimeline } from './scoring/jumbo-memory-capture-scorer.js';
import { baselineProtocolAdherenceScore, scoreProtocolAdherence, scoreProtocolAdherenceTimeline } from './scoring/protocol-adherence-scorer.js';
import { compareTokenEfficiency, tokenUsageTimeline } from './scoring/token-efficiency-scorer.js';
import type { JudgeConfig, JudgeFn } from './scoring/llm-judge-scorer.js';
import { scoreAllJudgeDimensions } from './scoring/llm-judge-scorer.js';

export interface ABRunConfig {
  readonly scenario: TestScenario;
  readonly adapter: HarnessAdapter;
  readonly executor: LocalExecutor;
  readonly store: ResultStore;
  readonly judgeConfig?: JudgeConfig;
  readonly judgeFn?: JudgeFn;
  readonly runId?: string;
  readonly heartbeatWriter?: HeartbeatWriter;
}

interface RunningSpan {
  readonly startedAt: string;
  readonly startedHrtime: bigint;
}

interface HeartbeatContext {
  readonly runId: string;
  readonly writer: HeartbeatWriter;
}

export class JumboInitError extends Error {
  constructor(
    message: string,
    readonly result: ExecResult,
  ) {
    super(message);
    this.name = 'JumboInitError';
  }
}

export class JumboReachabilityError extends Error {
  constructor(
    message: string,
    readonly variant: 'jumbo' | 'baseline',
    readonly result: ExecResult,
  ) {
    super(message);
    this.name = 'JumboReachabilityError';
  }
}

export class JumboBaselineLeakError extends Error {
  constructor(
    message: string,
    readonly result: ExecResult,
  ) {
    super(message);
    this.name = 'JumboBaselineLeakError';
  }
}

export class JumboPlanSeedError extends Error {
  constructor(
    message: string,
    readonly entry: JumboPlanEntry,
    readonly result: ExecResult,
  ) {
    super(message);
    this.name = 'JumboPlanSeedError';
  }
}

export class JumboPlanGoalRegistrationError extends Error {
  constructor(
    message: string,
    readonly goal: JumboPlanGoal,
    readonly result: ExecResult,
  ) {
    super(message);
    this.name = 'JumboPlanGoalRegistrationError';
  }
}

export class TamperAbortError extends Error {
  constructor(
    message: string,
    readonly variant: 'jumbo' | 'baseline',
    readonly tamperedRecords: readonly SessionRecord[],
  ) {
    super(message);
    this.name = 'TamperAbortError';
  }
}

const PAUSE_POLL_INTERVAL_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function assertJumboReachable(
  workDir: string,
  executor: LocalExecutor,
): Promise<void> {
  const result = await executor.exec(workDir, ['jumbo', '--version']);
  if (result.exitCode !== 0) {
    throw new JumboReachabilityError(
      `jumbo --version failed in jumbo workdir with exit code ${result.exitCode}. ` +
        `The adapter cannot invoke jumbo — check PATH and per-adapter permission seeding. ` +
        `stderr: ${result.stderr.trim() || '(empty)'}`,
      'jumbo',
      result,
    );
  }
}

/**
 * Probes the baseline workdir to assert jumbo is NOT reachable on PATH (after
 * the baseline shim is installed). This enforces the parity invariant: the
 * treatment under test is the whole Jumbo system, so the baseline agent must
 * not have access to the jumbo binary. The probe result is also recorded as
 * evidence so any leak is loud and explainable.
 */
async function assertJumboUnreachableFromBaseline(
  workDir: string,
  executor: LocalExecutor,
  baselineEnv: Record<string, string>,
): Promise<ExecResult> {
  const result = await executor.exec(workDir, ['jumbo', '--version'], { env: baselineEnv });
  if (result.exitCode === 0) {
    throw new JumboBaselineLeakError(
      `jumbo --version unexpectedly succeeded in the baseline workdir. ` +
        `Baseline parity requires that the agent cannot reach the real jumbo ` +
        `binary; the shim setup failed to shadow it. stdout: ${result.stdout.trim() || '(empty)'}`,
      result,
    );
  }
  return result;
}

function isEventRelevant(
  event: TamperEvent,
  harness: string,
  variant: 'jumbo' | 'baseline',
): boolean {
  if (event.action === 'inject-context') {
    if (variant !== 'jumbo') return false;
    if (event.variant !== undefined && event.variant !== 'jumbo') return false;
    if (event.harness !== undefined && event.harness !== harness) return false;
    return true;
  }
  if (event.harness !== undefined && event.harness !== harness) return false;
  if (event.variant !== undefined && event.variant !== variant) return false;
  return true;
}

interface ControlPollResult {
  readonly abortEvent: TamperEvent | null;
  readonly newEvents: readonly TamperEvent[];
  readonly injectedContext?: string;
}

async function pollAndApplyControl(params: {
  store: ResultStore;
  runId: string;
  harness: string;
  variant: 'jumbo' | 'baseline';
}): Promise<ControlPollResult> {
  const { store, runId, harness, variant } = params;
  const collected: TamperEvent[] = [];
  let injectedContext: string | undefined;
  let abortEvent: TamperEvent | null = null;

  if (typeof store.readRunControl !== 'function' || typeof store.writeRunControl !== 'function') {
    return { abortEvent: null, newEvents: [], injectedContext: undefined };
  }

  while (true) {
    const control = await store.readRunControl(runId);
    if (!control) {
      return { abortEvent, newEvents: collected, injectedContext };
    }

    if (control.pendingActions.length > 0) {
      const drained: TamperEvent[] = [];
      for (const ev of control.pendingActions) {
        if (!isEventRelevant(ev, harness, variant)) continue;
        drained.push(ev);
        if (ev.action === 'inject-context' && ev.payload) {
          injectedContext = injectedContext === undefined
            ? ev.payload
            : `${injectedContext}\n\n${ev.payload}`;
        }
        if (ev.action === 'abort') {
          abortEvent = ev;
        }
      }
      collected.push(...drained);
      const next: RunControlFile = {
        runId: control.runId,
        updatedAt: new Date().toISOString(),
        pendingActions: [],
        pauseRequested: control.pauseRequested,
        abortRequested: control.abortRequested,
      };
      await store.writeRunControl(runId, next);
    }

    if (control.abortRequested) {
      if (!abortEvent) {
        abortEvent = {
          occurredAt: new Date().toISOString(),
          action: 'abort',
          harness,
          variant,
        };
        collected.push(abortEvent);
      }
      return { abortEvent, newEvents: collected, injectedContext };
    }

    if (control.pauseRequested) {
      await delay(PAUSE_POLL_INTERVAL_MS);
      continue;
    }

    return { abortEvent, newEvents: collected, injectedContext };
  }
}

/**
 * Returns the provider-neutral scenario prompt for a given session number.
 * Session 1 gets the initial prompt; subsequent sessions get the continuation prompt.
 * If a disruption is scheduled for this session, its content is prepended.
 * Both variants (Jumbo and baseline) derive from this byte-identical prompt per session.
 */
export function getSessionPrompt(scenario: TestScenario, sessionNumber: number): string {
  let prompt: string;
  if (sessionNumber === 1) {
    prompt = scenario.initialPrompt;
  } else {
    prompt = scenario.continuationPrompt ?? 'Continue working on the project. Review what has been done so far and proceed with the next steps.';
  }

  // Inject disruptions scheduled for this session
  const disruptions = (scenario.disruptions ?? []).filter((d) => d.sessionNumber === sessionNumber);
  if (disruptions.length > 0) {
    const disruptionText = disruptions.map((d) =>
      `[${d.type.toUpperCase()}]: ${d.content}`,
    ).join('\n\n');
    prompt = `${disruptionText}\n\n${prompt}`;
  }

  return prompt;
}

/**
 * Composes the Jumbo arm's session prompt. The framework no longer injects
 * `jumbo session start` stdout into the prompt — instead, the agent is
 * instructed to drive the lifecycle itself. The composed prompt has three
 * parts: (a) the scenario prompt for the session, (b) the goal-id the
 * framework assigned for this session, and (c) the explicit lifecycle
 * protocol the agent must follow. Pure function — no I/O.
 */
export function buildJumboLifecyclePrompt(params: {
  scenarioPrompt: string;
  activeGoalId: string;
  injectedContext?: string;
}): string {
  const protocol = [
    'Jumbo lifecycle protocol — execute in order:',
    '1. Run `jumbo session start` to load project orientation.',
    `2. Run \`jumbo goal start --id ${params.activeGoalId}\` to load the active goal context.`,
    '3. Capture decisions, components, invariants, dependencies, and relations via the corresponding `jumbo <kind> add` commands as you make them — not as a cleanup step at the end.',
    `4. Track progress with \`jumbo goal update-progress --id ${params.activeGoalId} --task-description "<description>"\` as you complete sub-tasks.`,
    `5. When implementation is complete and all success criteria are met, run \`jumbo goal submit --id ${params.activeGoalId}\`.`,
    '6. Run `jumbo session end --focus "<focus>" --summary "<summary>"` to close the session.',
  ].join('\n');

  const sections: string[] = [
    `Active goal for this session: ${params.activeGoalId}`,
    protocol,
  ];
  if (params.injectedContext !== undefined) {
    sections.push(`[OPERATOR-INJECTED CONTEXT]:\n${params.injectedContext}`);
  }
  sections.push('Scenario task for this session:', params.scenarioPrompt);
  return sections.join('\n\n');
}

function startSpan(): RunningSpan {
  return {
    startedAt: new Date().toISOString(),
    startedHrtime: process.hrtime.bigint(),
  };
}

function completeSpan(span: RunningSpan): TimingSpan {
  return {
    startedAt: span.startedAt,
    completedAt: new Date().toISOString(),
    elapsedMs: Math.max(0.001, Number(process.hrtime.bigint() - span.startedHrtime) / 1_000_000),
  };
}

async function emitHeartbeat(params: {
  heartbeat?: HeartbeatContext;
  scenario: TestScenario;
  harness: string;
  variant: 'jumbo' | 'baseline';
  session: SessionHeartbeat;
}): Promise<void> {
  if (!params.heartbeat) return;
  await params.heartbeat.writer.writeHeartbeat(
    params.heartbeat.runId,
    buildHeartbeatUpdate({
      runId: params.heartbeat.runId,
      scenarioId: params.scenario.id,
      harness: params.harness,
      variant: params.variant,
      session: params.session,
    }),
  );
}

const JUMBO_MEMORY_COMMANDS: ReadonlyArray<{
  readonly kind: JumboMemoryKind;
  readonly command: readonly string[];
}> = [
  { kind: 'decision', command: ['jumbo', 'decisions', 'list', '--format', 'json'] },
  { kind: 'guideline', command: ['jumbo', 'guidelines', 'list', '--format', 'json'] },
  { kind: 'invariant', command: ['jumbo', 'invariants', 'list', '--format', 'json'] },
  { kind: 'component', command: ['jumbo', 'components', 'list', '--format', 'json'] },
  { kind: 'relation', command: ['jumbo', 'relations', 'list', '--format', 'json'] },
  { kind: 'dependency', command: ['jumbo', 'dependencies', 'list', '--format', 'json'] },
];

/**
 * Default plan used when a scenario omits jumboPlan. Preserves today's
 * behavior: no preSeededMemory, no progressive release, the agent picks
 * from the (empty) backlog. Existing fixtures keep working.
 */
const DEFAULT_JUMBO_PLAN: JumboPlan = { goals: [] };

function buildPlanEntryCommand(entry: JumboPlanEntry): string[] {
  switch (entry.kind) {
    case 'decision': {
      const cmd = ['jumbo', 'decision', 'add', '--title', entry.title, '--context', entry.context];
      if (entry.rationale !== undefined) cmd.push('--rationale', entry.rationale);
      if (entry.consequences !== undefined) cmd.push('--consequences', entry.consequences);
      for (const alt of entry.alternatives ?? []) cmd.push('--alternative', alt);
      return cmd;
    }
    case 'component':
      return [
        'jumbo', 'component', 'add',
        '--name', entry.name,
        '--type', entry.type,
        '--description', entry.description,
        '--responsibility', entry.responsibility,
        '--path', entry.path,
      ];
    case 'invariant': {
      const cmd = ['jumbo', 'invariant', 'add', '--title', entry.title, '--description', entry.description];
      if (entry.rationale !== undefined) cmd.push('--rationale', entry.rationale);
      return cmd;
    }
    case 'dependency': {
      const cmd = [
        'jumbo', 'dependency', 'add',
        '--name', entry.name,
        '--ecosystem', entry.ecosystem,
        '--package-name', entry.packageName,
      ];
      if (entry.versionConstraint !== undefined) cmd.push('--version-constraint', entry.versionConstraint);
      if (entry.endpoint !== undefined) cmd.push('--endpoint', entry.endpoint);
      if (entry.contract !== undefined) cmd.push('--contract', entry.contract);
      return cmd;
    }
    case 'relation': {
      const cmd = [
        'jumbo', 'relation', 'add',
        '--from-type', entry.fromType,
        '--from-id', entry.fromId,
        '--to-type', entry.toType,
        '--to-id', entry.toId,
        '--type', entry.type,
        '--description', entry.description,
      ];
      if (entry.strength !== undefined) cmd.push('--strength', entry.strength);
      return cmd;
    }
  }
}

function buildGoalAddCommand(goal: JumboPlanGoal, prerequisiteGoalIds: readonly string[]): string[] {
  const cmd = [
    'jumbo', 'goal', 'add',
    '--title', goal.title,
    '--objective', goal.objective,
  ];
  for (const c of goal.criteria) cmd.push('--criteria', c);
  for (const s of goal.scopeIn ?? []) cmd.push('--scope-in', s);
  for (const s of goal.scopeOut ?? []) cmd.push('--scope-out', s);
  for (const p of prerequisiteGoalIds) cmd.push('--prerequisite-goals', p);
  return cmd;
}

const GOAL_ID_KEYS = ['goalId', 'id', 'uuid'] as const;

function extractGoalId(stdout: string): string | undefined {
  const trimmed = stdout.trim();
  if (trimmed.length === 0) return undefined;
  // Try JSON object first; fall back to plain UUID-on-stdout.
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const record = asRecord(parsed);
    if (record) {
      for (const key of GOAL_ID_KEYS) {
        const value = record[key];
        if (typeof value === 'string' && value.length > 0) return value;
      }
      const nested = asRecord(record.goal);
      if (nested) {
        for (const key of GOAL_ID_KEYS) {
          const value = nested[key];
          if (typeof value === 'string' && value.length > 0) return value;
        }
      }
    }
  } catch {
    // Not JSON; jumbo may print just the id on stdout.
  }
  const uuidMatch = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return uuidMatch ? uuidMatch[0] : undefined;
}

async function seedJumboPlanMemory(params: {
  plan: JumboPlan;
  workDir: string;
  executor: LocalExecutor;
}): Promise<void> {
  for (const entry of params.plan.preSeededMemory ?? []) {
    const command = buildPlanEntryCommand(entry);
    const result = await params.executor.exec(params.workDir, command);
    if (result.exitCode !== 0) {
      throw new JumboPlanSeedError(
        `pre-seed ${entry.kind} failed with exit code ${result.exitCode}: ${result.stderr.trim() || '(empty)'}`,
        entry,
        result,
      );
    }
  }
}

async function registerJumboPlanGoal(params: {
  goal: JumboPlanGoal;
  workDir: string;
  executor: LocalExecutor;
  refToId: Map<string, string>;
}): Promise<string> {
  const prerequisiteIds: string[] = [];
  for (const ref of params.goal.prerequisitePlanRefs ?? []) {
    const id = params.refToId.get(ref);
    if (!id) {
      throw new Error(
        `JumboPlan goal "${params.goal.title}" references unknown prerequisitePlanRef "${ref}"`,
      );
    }
    prerequisiteIds.push(id);
  }
  const command = buildGoalAddCommand(params.goal, prerequisiteIds);
  const result = await params.executor.exec(params.workDir, command);
  if (result.exitCode !== 0) {
    throw new JumboPlanGoalRegistrationError(
      `jumbo goal add failed for "${params.goal.title}" with exit code ${result.exitCode}: ${result.stderr.trim() || '(empty)'}`,
      params.goal,
      result,
    );
  }
  const goalId = extractGoalId(result.stdout);
  if (!goalId) {
    throw new JumboPlanGoalRegistrationError(
      `jumbo goal add for "${params.goal.title}" succeeded but did not return a parseable goal id`,
      params.goal,
      result,
    );
  }
  if (params.goal.planRef) {
    params.refToId.set(params.goal.planRef, goalId);
  }
  return goalId;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null;
}

function entityId(kind: JumboMemoryKind, value: unknown): string | undefined {
  const record = asRecord(value);
  if (!record) return undefined;
  const candidate = record.id
    ?? record[`${kind}Id`]
    ?? record.uuid
    ?? record.name
    ?? record.title;
  return typeof candidate === 'string' ? candidate : undefined;
}

function entityText(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function listItems(kind: JumboMemoryKind, parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  const record = asRecord(parsed);
  if (!record) return [];

  const pluralKey = `${kind}s`;
  const candidates = [
    record.items,
    record.data,
    record.results,
    record[pluralKey],
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function parseJumboMemoryEntities(kind: JumboMemoryKind, stdout: string): JumboMemoryEntity[] {
  if (stdout.trim().length === 0) return [];

  const parsed = JSON.parse(stdout) as unknown;
  return listItems(kind, parsed).map((item) => ({
    kind,
    id: entityId(kind, item),
    text: entityText(item),
    raw: item,
  }));
}

async function captureJumboMemorySnapshot(params: {
  sessionNumber: number;
  workDir: string;
  executor: LocalExecutor;
}): Promise<JumboMemorySnapshot> {
  const commandResults: JumboMemoryCommandResult[] = [];
  const entities: JumboMemoryEntity[] = [];

  for (const spec of JUMBO_MEMORY_COMMANDS) {
    const result = await params.executor.exec(params.workDir, [...spec.command]);
    commandResults.push({
      kind: spec.kind,
      command: spec.command,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    });

    if (result.exitCode === 0) {
      entities.push(...parseJumboMemoryEntities(spec.kind, result.stdout));
    }
  }

  return {
    sessionNumber: params.sessionNumber,
    capturedAt: new Date().toISOString(),
    entities,
    commands: commandResults,
  };
}

function parseGoalStatus(stdout: string): string | undefined {
  if (stdout.trim().length === 0) return undefined;
  try {
    const parsed = JSON.parse(stdout) as unknown;
    const root = asRecord(parsed);
    const goal = asRecord(root?.goal) ?? root;
    const status = goal?.status;
    return typeof status === 'string' ? status : undefined;
  } catch {
    return undefined;
  }
}

function parseGoalVersion(stdout: string): number | undefined {
  if (stdout.trim().length === 0) return undefined;
  try {
    const parsed = JSON.parse(stdout) as unknown;
    const root = asRecord(parsed);
    const goal = asRecord(root?.goal) ?? root;
    const v = goal?.version;
    return typeof v === 'number' ? v : undefined;
  } catch {
    return undefined;
  }
}

function diffSnapshotEntities(
  before: JumboMemorySnapshot | undefined,
  after: JumboMemorySnapshot | undefined,
): JumboMemoryEntity[] {
  if (!after) return [];
  const keyOf = (entity: JumboMemoryEntity): string =>
    entity.id ? `${entity.kind}:id:${entity.id}` : `${entity.kind}:${entity.text.toLowerCase().replace(/\s+/g, ' ').trim()}`;
  const beforeKeys = new Set<string>();
  for (const entity of before?.entities ?? []) beforeKeys.add(keyOf(entity));
  return after.entities.filter((entity) => !beforeKeys.has(keyOf(entity)));
}

function parseSessionsCount(stdout: string): number {
  if (stdout.trim().length === 0) return 0;
  try {
    const parsed = JSON.parse(stdout) as unknown;
    if (Array.isArray(parsed)) return parsed.length;
    const record = asRecord(parsed);
    if (record) {
      for (const key of ['sessions', 'items', 'data', 'results']) {
        const value = record[key];
        if (Array.isArray(value)) return value.length;
      }
    }
    return 0;
  } catch {
    return 0;
  }
}

const GOAL_POST_START_STATUSES = new Set([
  'doing', 'paused', 'blocked', 'submitted', 'in-review', 'reviewed', 'rejected',
  'approved', 'codifying', 'done', 'closed', 'completed',
]);

const GOAL_POST_SUBMIT_STATUSES = new Set([
  'submitted', 'in-review', 'reviewed', 'approved', 'codifying', 'done', 'closed', 'completed',
]);

function toCommandResult(command: readonly string[], result: ExecResult): JumboLifecycleCommandResult {
  return {
    command,
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
  };
}

async function captureLifecycleSnapshot(params: {
  workDir: string;
  executor: LocalExecutor;
  activeGoalId?: string;
}): Promise<{
  readonly goalStatus?: string;
  readonly goalVersion?: number;
  readonly sessionsTotal: number;
  readonly sessionsEnded: number;
  readonly goalShow?: JumboLifecycleCommandResult;
  readonly sessionsList?: JumboLifecycleCommandResult;
  readonly sessionsEndedList?: JumboLifecycleCommandResult;
}> {
  let goalShow: JumboLifecycleCommandResult | undefined;
  let goalStatus: string | undefined;
  let goalVersion: number | undefined;
  if (params.activeGoalId !== undefined) {
    const command = ['jumbo', 'goal', 'show', '--id', params.activeGoalId, '--format', 'json'];
    const result = await params.executor.exec(params.workDir, command);
    goalShow = toCommandResult(command, result);
    if (result.exitCode === 0) {
      goalStatus = parseGoalStatus(result.stdout);
      goalVersion = parseGoalVersion(result.stdout);
    }
  }

  const sessionsListCommand = ['jumbo', 'sessions', 'list', '--status', 'all', '--format', 'json'];
  const sessionsListResult = await params.executor.exec(params.workDir, sessionsListCommand);
  const sessionsList = toCommandResult(sessionsListCommand, sessionsListResult);
  const sessionsTotal = sessionsListResult.exitCode === 0
    ? parseSessionsCount(sessionsListResult.stdout)
    : 0;

  const sessionsEndedCommand = ['jumbo', 'sessions', 'list', '--status', 'ended', '--format', 'json'];
  const sessionsEndedResult = await params.executor.exec(params.workDir, sessionsEndedCommand);
  const sessionsEndedList = toCommandResult(sessionsEndedCommand, sessionsEndedResult);
  const sessionsEnded = sessionsEndedResult.exitCode === 0
    ? parseSessionsCount(sessionsEndedResult.stdout)
    : 0;

  return { goalStatus, goalVersion, sessionsTotal, sessionsEnded, goalShow, sessionsList, sessionsEndedList };
}

async function captureDecisionsListResult(params: {
  workDir: string;
  executor: LocalExecutor;
}): Promise<JumboLifecycleCommandResult> {
  const command = ['jumbo', 'decisions', 'list', '--format', 'json'];
  const result = await params.executor.exec(params.workDir, command);
  return toCommandResult(command, result);
}

async function performLifecycleAudit(params: {
  workDir: string;
  executor: LocalExecutor;
  activeGoalId?: string;
  pre: Awaited<ReturnType<typeof captureLifecycleSnapshot>>;
  preMemorySnapshot?: JumboMemorySnapshot;
  postMemorySnapshot?: JumboMemorySnapshot;
}): Promise<JumboLifecycleAudit> {
  const post = await captureLifecycleSnapshot({
    workDir: params.workDir,
    executor: params.executor,
    activeGoalId: params.activeGoalId,
  });
  const decisionsListAfter = await captureDecisionsListResult({
    workDir: params.workDir,
    executor: params.executor,
  });

  const sessionsTotalDelta = post.sessionsTotal - params.pre.sessionsTotal;
  const sessionsEndedDelta = post.sessionsEnded - params.pre.sessionsEnded;
  const sessionStartExecuted = sessionsTotalDelta > 0 || sessionsEndedDelta > 0;
  const sessionEndExecuted = sessionsEndedDelta > 0;
  const goalStartExecuted = params.activeGoalId !== undefined
    && post.goalStatus !== undefined
    && GOAL_POST_START_STATUSES.has(post.goalStatus);
  const goalSubmitExecuted = params.activeGoalId !== undefined
    && post.goalStatus !== undefined
    && GOAL_POST_SUBMIT_STATUSES.has(post.goalStatus);

  // In-session captures: entities present in the post snapshot but not in
  // the pre snapshot. Pre-seeded memory is in both, so only entities the
  // agent registered during this session window count.
  const newEntities = diffSnapshotEntities(params.preMemorySnapshot, params.postMemorySnapshot);
  const inSessionCapturesExecuted = newEntities.length > 0;

  // Progress updates: derived from the goal aggregate's version delta. The
  // canonical lifecycle accounts for at most one mutation each from goal
  // start (refined→doing) and goal submit (doing→submitted). Any version
  // delta beyond that implies extra mutations on the goal — the most likely
  // source being `jumbo goal update-progress`. This is a snapshot-format
  // heuristic; precise progress-entry inspection requires a CLI surface
  // that emits progress entries in the `goal show` JSON, which is out of
  // scope here (snapshot-format contract guideline).
  const versionDelta =
    typeof post.goalVersion === 'number' && typeof params.pre.goalVersion === 'number'
      ? post.goalVersion - params.pre.goalVersion
      : undefined;
  const baselineMutations =
    (goalStartExecuted ? 1 : 0) + (goalSubmitExecuted ? 1 : 0);
  const progressUpdatesExecuted = versionDelta !== undefined && versionDelta > baselineMutations;

  const evidence: JumboLifecycleEvidence = {
    goalShowBefore: params.pre.goalShow,
    goalShowAfter: post.goalShow,
    sessionsListBefore: params.pre.sessionsList,
    sessionsListAfter: post.sessionsList,
    sessionsEndedListAfter: post.sessionsEndedList,
    decisionsListAfter,
  };

  return {
    sessionStartExecuted,
    goalStartExecuted,
    inSessionCapturesExecuted,
    progressUpdatesExecuted,
    goalSubmitExecuted,
    sessionEndExecuted,
    activeGoalId: params.activeGoalId,
    goalStatusBefore: params.pre.goalStatus,
    goalStatusAfter: post.goalStatus,
    goalVersionBefore: params.pre.goalVersion,
    goalVersionAfter: post.goalVersion,
    sessionsTotalDelta,
    sessionsEndedDelta,
    newEntityCount: newEntities.length,
    evidence,
  };
}

/**
 * Runs N sessions inside a single persistent working directory.
 *
 * For Jumbo runs the framework no longer issues `jumbo session start` or
 * `jumbo session end` on the agent's behalf. Each Jumbo session prompt
 * contains the scenario task, the framework-picked active goal-id, and an
 * explicit lifecycle protocol that the agent executes itself. After the
 * harness exec the framework verifies what the agent did via `jumbo goal
 * show`, `jumbo sessions list`, and `jumbo decisions list` and records the
 * result on the SessionRecord as JumboLifecycleAudit.
 *
 * When a jumboPlan is supplied (jumbo variant only), the framework registers
 * any plan goals whose sessionAvailableFrom matches the current session
 * boundary, then picks the active goal-id for the session and threads it
 * into the prompt builder. The agent never picks from the backlog.
 */
async function runMultiSession(params: {
  scenario: TestScenario;
  workDir: string;
  executor: LocalExecutor;
  adapter: HarnessAdapter;
  store: ResultStore;
  jumboEnabled: boolean;
  plan?: JumboPlan;
  runId?: string;
  heartbeatWriter?: HeartbeatWriter;
  env?: Record<string, string | undefined>;
}): Promise<SessionRecord[]> {
  const { scenario, workDir, executor, adapter, store, jumboEnabled } = params;
  const variant = jumboEnabled ? 'jumbo' : 'baseline';
  const heartbeat = params.runId && params.heartbeatWriter
    ? { runId: params.runId, writer: params.heartbeatWriter }
    : undefined;
  const records: SessionRecord[] = [];
  let tainted = false;
  // refToId maps plan-local goal/entity refs to real CLI-minted IDs so that
  // later plan goals can declare prerequisites that resolve correctly.
  const refToId = new Map<string, string>();
  let lastActiveGoalId: string | undefined;

  for (let sessionNum = 1; sessionNum <= scenario.sessionCount; sessionNum++) {
    let pendingEventsForSession: readonly TamperEvent[] = [];
    let injectedContextForSession: string | undefined;
    if (params.runId) {
      const poll = await pollAndApplyControl({
        store,
        runId: params.runId,
        harness: adapter.name,
        variant,
      });
      if (poll.newEvents.length > 0) tainted = true;
      pendingEventsForSession = poll.newEvents;
      injectedContextForSession = poll.injectedContext;
      if (poll.abortEvent) {
        const tamperedExisting = records.map((r, idx) => ({
          ...r,
          tampered: true,
          tamperLog: idx === records.length - 1
            ? [...r.tamperLog, ...poll.newEvents]
            : r.tamperLog,
        }));
        await Promise.all(tamperedExisting.map((r) => store.saveSessionRecord(r)));
        throw new TamperAbortError(
          `Run aborted by operator at session ${sessionNum} boundary (variant=${variant})`,
          variant,
          tamperedExisting,
        );
      }
    }
    const sessionStartedAt = new Date().toISOString();
    let phaseTimings: Partial<SessionPhaseTimings> = {};
    let activeGoalIdForSession: string | undefined;

    // Register plan goals scheduled for this session boundary, in plan order.
    // Only the jumbo arm has a live Jumbo project; the baseline arm runs
    // without any backlog (its scope is out for this goal).
    if (jumboEnabled && params.plan) {
      const dueGoals = params.plan.goals.filter((g) => g.sessionAvailableFrom === sessionNum);
      for (const goal of dueGoals) {
        const goalId = await registerJumboPlanGoal({
          goal,
          workDir,
          executor,
          refToId,
        });
        if (activeGoalIdForSession === undefined) {
          activeGoalIdForSession = goalId;
        }
      }
    }
    if (activeGoalIdForSession === undefined) {
      activeGoalIdForSession = lastActiveGoalId;
    } else {
      lastActiveGoalId = activeGoalIdForSession;
    }

    await emitHeartbeat({
      heartbeat,
      scenario,
      harness: adapter.name,
      variant,
      session: {
        sessionNumber: sessionNum,
        status: 'running',
        startedAt: sessionStartedAt,
        phase: 'harness-exec',
      },
    });

    // Pre-harness snapshots: capture Jumbo's own state of the active
    // goal, session list, and project memory so the post-session audit
    // can prove the agent (not the framework) drove the lifecycle this
    // session, and the scorer can credit only entities the agent
    // registered during this session window.
    const preLifecycleSnapshot = jumboEnabled
      ? await captureLifecycleSnapshot({
          workDir,
          executor,
          activeGoalId: activeGoalIdForSession,
        })
      : undefined;
    const preMemorySnapshot = jumboEnabled
      ? await captureJumboMemorySnapshot({
          sessionNumber: sessionNum,
          workDir,
          executor,
        })
      : undefined;

    const scenarioPrompt = getSessionPrompt(scenario, sessionNum);
    const deliveredContextForSession = injectedContextForSession !== undefined
      ? `[OPERATOR-INJECTED CONTEXT]:\n${injectedContextForSession}`
      : undefined;
    const effectivePrompt = jumboEnabled && activeGoalIdForSession !== undefined
      ? buildJumboLifecyclePrompt({
          scenarioPrompt,
          activeGoalId: activeGoalIdForSession,
          injectedContext: injectedContextForSession,
        })
      : scenarioPrompt;

    let record: SessionRecord;
    try {
      const preExecSnapshot = await executor.captureWorkspaceSnapshot(workDir);
      const harnessSpan = startSpan();
      record = await runSession({
        scenario,
        sessionNumber: sessionNum,
        variant,
        prompt: effectivePrompt,
        scenarioPrompt,
        deliveredContext: deliveredContextForSession,
        workDir,
        executor,
        adapter,
        store,
        env: params.env,
      });
      phaseTimings = {
        ...phaseTimings,
        harnessExec: completeSpan(harnessSpan),
      };
      // Workspace-diff fallback: harness CLIs (Claude/Codex/Gemini) do not
      // reliably surface a files_modified field in their JSON output. The
      // pre/post workspace snapshot diff is ground truth for what the agent
      // created or edited during the harness exec.
      const diffFilesModified = record.workspaceSnapshot
        ? LocalExecutor.diffWorkspaceSnapshots(preExecSnapshot, record.workspaceSnapshot)
        : [];
      const filesModified = record.filesModified.length > 0
        ? record.filesModified
        : diffFilesModified;
      record = {
        ...record,
        filesModified,
        phaseTimings: phaseTimings as SessionPhaseTimings,
        tampered: tainted,
        tamperLog: pendingEventsForSession,
      };
      await store.saveSessionRecord(record);
    } catch (err: unknown) {
      await emitHeartbeat({
        heartbeat,
        scenario,
        harness: adapter.name,
        variant,
        session: {
          sessionNumber: sessionNum,
          status: 'failed',
          startedAt: sessionStartedAt,
          completedAt: new Date().toISOString(),
          phase: 'harness-exec',
          errorMessage: err instanceof Error ? err.message : String(err),
          phaseTimings: phaseTimings.harnessExec ? phaseTimings as SessionPhaseTimings : undefined,
        },
      });
      throw err;
    }

    // For Jumbo runs, verify the agent actually executed the lifecycle
    // protocol and capture the resulting memory snapshot. The audit reads
    // Jumbo's own state (goal show / sessions list / decisions list) — it
    // does not parse the agent transcript.
    if (jumboEnabled) {
      await emitHeartbeat({
        heartbeat,
        scenario,
        harness: adapter.name,
        variant,
        session: {
          sessionNumber: sessionNum,
          status: 'running',
          startedAt: sessionStartedAt,
          phase: 'lifecycle-audit',
          phaseTimings: phaseTimings as SessionPhaseTimings,
        },
      });

      const auditSpan = startSpan();
      // Post-harness memory snapshot captured first so the lifecycle audit
      // can diff pre/post and derive in-session captures.
      const postMemorySnapshot = await captureJumboMemorySnapshot({
        sessionNumber: sessionNum,
        workDir,
        executor,
      });
      const audit = await performLifecycleAudit({
        workDir,
        executor,
        activeGoalId: activeGoalIdForSession,
        pre: preLifecycleSnapshot!,
        preMemorySnapshot,
        postMemorySnapshot,
      });
      const lifecycleAuditSpan = completeSpan(auditSpan);
      phaseTimings = {
        ...phaseTimings,
        lifecycleAudit: lifecycleAuditSpan,
      };
      record = {
        ...record,
        jumboLifecycleAudit: audit,
        jumboMemorySnapshotBefore: preMemorySnapshot,
        jumboMemorySnapshot: postMemorySnapshot,
        phaseTimings: phaseTimings as SessionPhaseTimings,
      };
      await store.saveSessionRecord(record);
    }

    await emitHeartbeat({
      heartbeat,
      scenario,
      harness: adapter.name,
      variant,
      session: {
        sessionNumber: sessionNum,
        status: 'completed',
        startedAt: sessionStartedAt,
        completedAt: record.completedAt,
        phaseTimings: record.phaseTimings,
      },
    });
    records.push(record);
  }

  return records;
}

/**
 * Runs an A/B comparison across N sessions. The treatment under test is the
 * whole Jumbo system — orchestration (CLI), memory (decisions/components/
 * invariants/relations/etc.), and the lifecycle protocol — not a memory-only
 * A/B.
 *
 * Variant A (jumbo): `jumbo init` at setup; per session the agent receives a
 *   scenario prompt + active goal-id + lifecycle protocol and drives session
 *   start/end and goal start/submit itself. The framework verifies execution
 *   via a post-session lifecycle audit.
 * Variant B (baseline): Jumbo not initialized — clean working directory and a
 *   PATH-shadowing shim so the real jumbo binary is unreachable. The agent
 *   receives only the scenario prompt, no Jumbo collaboration block.
 *
 * Parity invariants enforced here:
 *   (a) The scenario prompt is byte-identical between the two arms.
 *   (b) The Jumbo collaboration block (lifecycle protocol + active goal-id +
 *       operator-context wrapper) exists in exactly one arm — the jumbo arm.
 *   (c) The baseline arm cannot reach the real jumbo binary; any invocation
 *       resolves to the fail-loud shim and is recorded.
 *
 * Each variant gets its own temp working directory on the host. The directory
 * persists across sessions — only the agent invocation resets. Both results
 * must complete for a valid ComparisonResult.
 */
export async function runABComparison(config: ABRunConfig): Promise<ComparisonResult> {
  const { scenario, adapter, executor, store, judgeConfig, judgeFn } = config;
  const runId = config.runId ?? randomUUID();
  const heartbeatWriter = config.heartbeatWriter;

  const jumboWorkDir = await executor.createWorkDir(`jumbo-eval-jumbo-`);
  const baselineWorkDir = await executor.createWorkDir(`jumbo-eval-baseline-`);
  const heartbeat = heartbeatWriter ? { runId, writer: heartbeatWriter } : undefined;
  let jumboRecords: SessionRecord[] = [];
  let baselineRecords: SessionRecord[] = [];
  let scoringStarted = false;

  try {
    // Seed per-adapter permission/config artifacts in both arms so the
    // agent CLI can shell out without interactive approval. Done before any
    // session work so a misconfigured environment fails loudly at setup,
    // not mid-run.
    await adapter.seedToolPermissions(jumboWorkDir);
    await adapter.seedToolPermissions(baselineWorkDir);

    // Baseline parity setup: install a PATH-shadowing shim so `jumbo`
    // resolves to a fail-loud script in the baseline arm. The treatment
    // under test is the whole Jumbo system, so the baseline agent must not
    // be able to call the real jumbo binary.
    const { env: baselineEnv } = await executor.installJumboShim(baselineWorkDir);

    // Probe both arms via the same exec channel the adapter will use during
    // sessions. The jumbo arm must reach jumbo; the baseline arm must not.
    // Fail before any session work begins (lifecycle-setup invariant).
    await assertJumboReachable(jumboWorkDir, executor);
    await assertJumboUnreachableFromBaseline(baselineWorkDir, executor, baselineEnv);

    // Initialize Jumbo in the Jumbo working directory
    const initResult = await executor.exec(jumboWorkDir, [
      'jumbo',
      'init',
      '--purpose',
      scenario.name,
      '--non-interactive',
      '--name',
      scenario.name,
      '--yolo',
    ]);
    if (initResult.exitCode !== 0) {
      throw new JumboInitError(
        `jumbo init failed for scenario "${scenario.name}" with exit code ${initResult.exitCode}`,
        initResult,
      );
    }

    // Seed plan-supplied preSeededMemory into the jumbo arm only, after
    // init and before any session work begins. Failure here aborts before
    // sessions run (lifecycle-setup invariant).
    const plan = scenario.jumboPlan ?? DEFAULT_JUMBO_PLAN;
    await seedJumboPlanMemory({ plan, workDir: jumboWorkDir, executor });

    // Run N sessions in each working directory
    jumboRecords = await runMultiSession({
      scenario, workDir: jumboWorkDir, executor, adapter, store, jumboEnabled: true, plan, runId, heartbeatWriter,
    });

    baselineRecords = await runMultiSession({
      scenario, workDir: baselineWorkDir, executor, adapter, store, jumboEnabled: false, runId, heartbeatWriter,
      env: baselineEnv,
    });

    scoringStarted = true;
    await Promise.all((['jumbo', 'baseline'] as const).map((variant) =>
      emitHeartbeat({
        heartbeat,
        scenario,
        harness: adapter.name,
        variant,
        session: {
          sessionNumber: scenario.sessionCount,
          status: 'running',
          phase: 'scoring',
          phaseTimings: (variant === 'jumbo' ? jumboRecords : baselineRecords).at(-1)?.phaseTimings,
        },
      }),
    ));

    // Build TestResults
    const jumboResult = createTestResult({
      id: randomUUID(),
      scenarioId: scenario.id,
      harness: adapter.name,
      sessionRecords: jumboRecords,
    });

    const baselineResult = createTestResult({
      id: randomUUID(),
      scenarioId: scenario.id,
      harness: adapter.name,
      sessionRecords: baselineRecords,
    });

    await store.saveTestResult(jumboResult);
    await store.saveTestResult(baselineResult);

    // Score both runs — aggregate across all sessions
    const expectedFiles = scenario.expectedFiles ?? [];
    const retentionPatterns = scenario.retentionPatterns ?? [];
    const disruptions = scenario.disruptions ?? [];
    const expectedJumboMemoryCaptures = scenario.expectedJumboMemoryCaptures ?? [];

    const jumboCleanRecords = jumboRecords.filter((r) => !r.tampered);
    const baselineCleanRecords = baselineRecords.filter((r) => !r.tampered);

    const jumboFileScore = scoreFileAccuracy(jumboCleanRecords, expectedFiles);
    const jumboRetentionScore = scoreKnowledgeRetention(jumboCleanRecords, retentionPatterns);
    const jumboDisruptionScore = scoreDisruptionRecovery(jumboCleanRecords, disruptions);
    const jumboMemoryScore = scoreJumboMemoryCapture(jumboCleanRecords, expectedJumboMemoryCaptures);
    const jumboProtocolScore = scoreProtocolAdherence(jumboCleanRecords);

    const baselineFileScore = scoreFileAccuracy(baselineCleanRecords, expectedFiles);
    const baselineRetentionScore = scoreKnowledgeRetention(baselineCleanRecords, retentionPatterns);
    const baselineDisruptionScore = scoreDisruptionRecovery(baselineCleanRecords, disruptions);
    const baselineMemoryScore = baselineJumboMemoryCaptureScore(expectedJumboMemoryCaptures);
    const baselineProtocolScore = baselineProtocolAdherenceScore();

    // Token efficiency: compare tokens-per-quality-point
    const jumboAvgQuality = (jumboFileScore.score + jumboRetentionScore.score) / 2;
    const baselineAvgQuality = (baselineFileScore.score + baselineRetentionScore.score) / 2;
    const tokenEfficiencyScore = compareTokenEfficiency(jumboCleanRecords, baselineCleanRecords, jumboAvgQuality, baselineAvgQuality);

    const jumboScores = [jumboFileScore, jumboRetentionScore, jumboDisruptionScore, jumboMemoryScore, jumboProtocolScore, tokenEfficiencyScore];
    const baselineScores = [baselineFileScore, baselineRetentionScore, baselineDisruptionScore, baselineMemoryScore, baselineProtocolScore, tokenEfficiencyScore];

    // LLM-judge scoring (optional — requires both judgeConfig and judgeFn)
    if (judgeConfig && judgeFn) {
      const jumboJudgeScores = await scoreAllJudgeDimensions(jumboCleanRecords, judgeConfig, judgeFn);
      const baselineJudgeScores = await scoreAllJudgeDimensions(baselineCleanRecords, judgeConfig, judgeFn);
      jumboScores.push(...jumboJudgeScores);
      baselineScores.push(...baselineJudgeScores);
    }

    // Compute deltas
    const deltas = jumboScores.map((js, i) => ({
      dimension: js.dimension,
      score: Math.round((js.score - baselineScores[i].score) * 100) / 100,
      maxScore: js.maxScore,
      details: `jumbo=${js.score.toFixed(2)} baseline=${baselineScores[i].score.toFixed(2)}`,
    }));

    // Build per-session timelines
    const jumboRetentionTimeline = scoreKnowledgeRetentionTimeline(jumboRecords, retentionPatterns);
    const baselineRetentionTimeline = scoreKnowledgeRetentionTimeline(baselineRecords, retentionPatterns);
    const jumboDisruptionTimeline = scoreDisruptionRecoveryTimeline(jumboRecords, disruptions);
    const baselineDisruptionTimeline = scoreDisruptionRecoveryTimeline(baselineRecords, disruptions);
    const jumboTokenTimeline = tokenUsageTimeline(jumboRecords);
    const baselineTokenTimeline = tokenUsageTimeline(baselineRecords);
    const jumboMemoryTimeline = scoreJumboMemoryCaptureTimeline(jumboRecords, expectedJumboMemoryCaptures);
    const baselineMemoryTimeline = baselineRecords.map(() => baselineMemoryScore);
    const jumboProtocolTimeline = scoreProtocolAdherenceTimeline(jumboRecords);
    const baselineProtocolTimeline = baselineRecords.map(() => baselineProtocolScore);

    const jumboTimeline: PerSessionScore[] = jumboRecords.map((r, i) => ({
      sessionNumber: r.sessionNumber,
      scores: [
        scoreFileAccuracy([r], expectedFiles),
        ...(jumboRetentionTimeline[i] ? [jumboRetentionTimeline[i]] : []),
        ...(jumboDisruptionTimeline[i] ? [jumboDisruptionTimeline[i]] : []),
        ...(jumboMemoryTimeline[i] ? [jumboMemoryTimeline[i]] : []),
        ...(jumboProtocolTimeline[i] ? [jumboProtocolTimeline[i]] : []),
        ...(jumboTokenTimeline[i] ? [jumboTokenTimeline[i]] : []),
      ],
    }));

    const baselineTimeline: PerSessionScore[] = baselineRecords.map((r, i) => ({
      sessionNumber: r.sessionNumber,
      scores: [
        scoreFileAccuracy([r], expectedFiles),
        ...(baselineRetentionTimeline[i] ? [baselineRetentionTimeline[i]] : []),
        ...(baselineDisruptionTimeline[i] ? [baselineDisruptionTimeline[i]] : []),
        ...(baselineMemoryTimeline[i] ? [baselineMemoryTimeline[i]] : []),
        ...(baselineProtocolTimeline[i] ? [baselineProtocolTimeline[i]] : []),
        ...(baselineTokenTimeline[i] ? [baselineTokenTimeline[i]] : []),
      ],
    }));

    const comparison = createComparisonResult({
      id: randomUUID(),
      scenarioId: scenario.id,
      harness: adapter.name,
      jumboResult,
      baselineResult,
      jumboScores,
      baselineScores,
      deltas,
      jumboTimeline,
      baselineTimeline,
    });

    await emitHeartbeat({
      heartbeat,
      scenario,
      harness: adapter.name,
      variant: 'jumbo',
      session: {
        sessionNumber: scenario.sessionCount,
        status: 'completed',
        completedAt: new Date().toISOString(),
        phaseTimings: jumboRecords.at(-1)?.phaseTimings,
      },
    });
    await emitHeartbeat({
      heartbeat,
      scenario,
      harness: adapter.name,
      variant: 'baseline',
      session: {
        sessionNumber: scenario.sessionCount,
        status: 'completed',
        completedAt: new Date().toISOString(),
        phaseTimings: baselineRecords.at(-1)?.phaseTimings,
      },
    });

    return comparison;
  } catch (err: unknown) {
    if (scoringStarted) {
      await Promise.all((['jumbo', 'baseline'] as const).map((variant) =>
        emitHeartbeat({
          heartbeat,
          scenario,
          harness: adapter.name,
          variant,
          session: {
            sessionNumber: scenario.sessionCount,
            status: 'failed',
            completedAt: new Date().toISOString(),
            phase: 'scoring',
            phaseTimings: (variant === 'jumbo' ? jumboRecords : baselineRecords).at(-1)?.phaseTimings,
            errorMessage: err instanceof Error ? err.message : String(err),
          },
        }),
      ));
    }
    throw err;
  } finally {
    await executor.cleanup(jumboWorkDir);
    await executor.cleanup(baselineWorkDir);
  }
}
