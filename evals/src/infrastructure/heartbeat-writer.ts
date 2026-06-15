import type { HarnessHeartbeat, RunHeartbeat, SessionHeartbeat } from '../domain/types.js';
import type { ResultStore } from '../storage/result-store.js';

export interface HeartbeatWriter {
  writeHeartbeat(runId: string, heartbeat: RunHeartbeat): Promise<void>;
}

export class StoreHeartbeatWriter implements HeartbeatWriter {
  private heartbeat: RunHeartbeat;

  constructor(
    private readonly store: Pick<ResultStore, 'writeHeartbeat'>,
    params: {
      readonly runId: string;
      readonly scenarioId: string;
      readonly harnesses: readonly string[];
      readonly sessionCount: number;
    },
  ) {
    this.heartbeat = {
      runId: params.runId,
      scenarioId: params.scenarioId,
      updatedAt: new Date().toISOString(),
      harnesses: params.harnesses.flatMap((harness) => [
        createHarnessHeartbeat(harness, 'jumbo', params.sessionCount),
        createHarnessHeartbeat(harness, 'baseline', params.sessionCount),
      ]),
    };
  }

  async writeHeartbeat(runId: string, heartbeat: RunHeartbeat): Promise<void> {
    this.heartbeat = mergeHeartbeat(this.heartbeat, heartbeat);
    await this.store.writeHeartbeat(runId, this.heartbeat);
  }

  async initialize(): Promise<void> {
    await this.store.writeHeartbeat(this.heartbeat.runId, this.heartbeat);
  }
}

export function createHarnessHeartbeat(
  harness: string,
  variant: 'jumbo' | 'baseline',
  sessionCount: number,
): HarnessHeartbeat {
  return {
    harness,
    variant,
    sessions: Array.from({ length: sessionCount }, (_, index) => ({
      sessionNumber: index + 1,
      status: 'pending',
    })),
  };
}

export function mergeHeartbeat(current: RunHeartbeat, update: RunHeartbeat): RunHeartbeat {
  const byKey = new Map(current.harnesses.map((heartbeat) => [harnessKey(heartbeat), heartbeat]));
  for (const harness of update.harnesses) {
    byKey.set(harnessKey(harness), mergeHarnessHeartbeat(byKey.get(harnessKey(harness)), harness));
  }

  return {
    runId: current.runId,
    scenarioId: current.scenarioId,
    updatedAt: update.updatedAt,
    harnesses: [...byKey.values()],
  };
}

function mergeHarnessHeartbeat(current: HarnessHeartbeat | undefined, update: HarnessHeartbeat): HarnessHeartbeat {
  if (!current) return update;
  const sessions = new Map(current.sessions.map((session) => [session.sessionNumber, session]));
  for (const session of update.sessions) {
    sessions.set(session.sessionNumber, session);
  }
  return {
    harness: update.harness,
    variant: update.variant,
    sessions: [...sessions.values()].sort((a, b) => a.sessionNumber - b.sessionNumber),
  };
}

function harnessKey(heartbeat: HarnessHeartbeat): string {
  return `${heartbeat.harness}:${heartbeat.variant}`;
}

export function buildHeartbeatUpdate(params: {
  readonly runId: string;
  readonly scenarioId: string;
  readonly harness: string;
  readonly variant: 'jumbo' | 'baseline';
  readonly session: SessionHeartbeat;
}): RunHeartbeat {
  return {
    runId: params.runId,
    scenarioId: params.scenarioId,
    updatedAt: new Date().toISOString(),
    harnesses: [{
      harness: params.harness,
      variant: params.variant,
      sessions: [params.session],
    }],
  };
}
