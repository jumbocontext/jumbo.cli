import { describe, it, expect } from '@jest/globals';
import { watchRunStatus, createWatchAppElement } from '../../src/cli/commands/status.js';
import type { ResultStore } from '../../src/storage/result-store.js';
import type { EvalRunRecord, RunHeartbeat, SessionRecord, TestResult, TestScenario } from '../../src/domain/types.js';

function buildHeartbeat(overrides: Partial<RunHeartbeat> = {}): RunHeartbeat {
  return {
    runId: 'run-1',
    scenarioId: 'scen-1',
    updatedAt: '2026-04-29T10:00:00.000Z',
    harnesses: [{
      harness: 'claude-code',
      variant: 'jumbo',
      sessions: [{
        sessionNumber: 1,
        status: 'completed',
        startedAt: '2026-04-29T10:00:00.000Z',
        completedAt: '2026-04-29T10:00:01.000Z',
      }],
    }],
    ...overrides,
  };
}

function buildRunningHeartbeat(): RunHeartbeat {
  return buildHeartbeat({
    harnesses: [{
      harness: 'claude-code',
      variant: 'jumbo',
      sessions: [{ sessionNumber: 1, status: 'running', phase: 'harness-exec', startedAt: new Date().toISOString() }],
    }],
  });
}

class FakeStore implements ResultStore {
  heartbeatQueue: Array<RunHeartbeat | null> = [];
  runRecord: EvalRunRecord | null = null;
  readCount = 0;

  async saveScenario(): Promise<void> {}
  async getScenario(): Promise<TestScenario | null> { return null; }
  async listScenarios(): Promise<TestScenario[]> { return []; }
  async saveSessionRecord(): Promise<void> {}
  async getSessionRecords(): Promise<SessionRecord[]> { return []; }
  async saveTestResult(): Promise<void> {}
  async getTestResult(): Promise<TestResult | null> { return null; }
  async listTestResults(): Promise<TestResult[]> { return []; }
  async saveRunRecord(): Promise<void> {}
  async getRunRecord(): Promise<EvalRunRecord | null> { return this.runRecord; }
  async listRunRecords(): Promise<EvalRunRecord[]> { return []; }
  async writeHeartbeat(): Promise<void> {}
  async readHeartbeat(): Promise<RunHeartbeat | null> {
    this.readCount += 1;
    if (this.heartbeatQueue.length === 0) return null;
    if (this.heartbeatQueue.length === 1) return this.heartbeatQueue[0];
    return this.heartbeatQueue.shift() ?? null;
  }
}

async function captureLog(fn: () => Promise<void>): Promise<string[]> {
  const messages: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]): void => { messages.push(args.map(String).join(' ')); };
  try {
    await fn();
  } finally {
    console.log = original;
  }
  return messages;
}

describe('watchRunStatus non-interactive', () => {
  it('prints a single final snapshot when the run is already complete', async () => {
    const store = new FakeStore();
    store.heartbeatQueue = [buildHeartbeat()];
    const messages = await captureLog(() => watchRunStatus(store, 'run-1', { isInteractive: false, pollIntervalMs: 1 }));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('Run: run-1');
  });

  it('prints "no heartbeat" exactly once when none exists', async () => {
    const store = new FakeStore();
    const messages = await captureLog(() => watchRunStatus(store, 'missing-run', { isInteractive: false, pollIntervalMs: 1 }));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('No heartbeat found for run: missing-run');
  });

  it('polls until completion then prints exactly one snapshot', async () => {
    const store = new FakeStore();
    store.heartbeatQueue = [buildRunningHeartbeat(), buildRunningHeartbeat(), buildHeartbeat()];
    const messages = await captureLog(() => watchRunStatus(store, 'run-1', { isInteractive: false, pollIntervalMs: 1 }));
    expect(store.readCount).toBeGreaterThanOrEqual(3);
    expect(messages).toHaveLength(1);
  });
});

describe('watchRunStatus interactive (ink)', () => {
  it('renders the heartbeat snapshot in-place via ink', async () => {
    const ink = await import('ink');
    const React = await import('react');
    const { render } = await import('ink-testing-library');

    const store = new FakeStore();
    store.heartbeatQueue = [buildHeartbeat()];

    const element = createWatchAppElement(React, ink, { store, runId: 'run-1', pollIntervalMs: 1 });
    const instance = render(element);

    await waitFor(() => instance.frames.some((f) => f.includes('Run: run-1')));

    const matched = instance.frames.find((f) => f.includes('Run: run-1')) ?? '';
    expect(matched).toContain('Run: run-1');
    expect(matched).toContain('Sessions');
    instance.unmount();
  });

  it('renders the missing-heartbeat message when no heartbeat is found', async () => {
    const ink = await import('ink');
    const React = await import('react');
    const { render } = await import('ink-testing-library');

    const store = new FakeStore();
    const element = createWatchAppElement(React, ink, { store, runId: 'missing-run', pollIntervalMs: 1 });
    const instance = render(element);

    await waitFor(() => instance.frames.some((f) => f.includes('No heartbeat found for run: missing-run')));

    const matched = instance.frames.find((f) => f.includes('No heartbeat found for run: missing-run')) ?? '';
    expect(matched).toContain('No heartbeat found for run: missing-run');
    instance.unmount();
  });

  it('updates frames in place across polls and unmounts on completion', async () => {
    const ink = await import('ink');
    const React = await import('react');
    const { render } = await import('ink-testing-library');

    const store = new FakeStore();
    store.heartbeatQueue = [buildRunningHeartbeat(), buildRunningHeartbeat(), buildHeartbeat()];

    const element = createWatchAppElement(React, ink, { store, runId: 'run-1', pollIntervalMs: 1 });
    const instance = render(element);

    await waitFor(() => instance.frames.some((f) => f.includes('completed') && f.includes('Run: run-1')));

    for (const frame of instance.frames) {
      const occurrences = frame.split('Run: run-1').length - 1;
      expect(occurrences).toBeLessThanOrEqual(1);
    }
    instance.unmount();
  });
});

async function waitFor(predicate: () => boolean, timeoutMs = 2000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error('waitFor timed out');
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}
