import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { scoreStructuralAssertions } from '../../src/scoring/structural-assertion-scorer.js';
import { createSessionRecord } from '../../src/domain/index.js';
import type { SessionRecord, StructuralAssertion, TestScenario } from '../../src/domain/index.js';

const scenario = JSON.parse(
  readFileSync(join(process.cwd(), 'scenarios', 'event-sourced-inventory.json'), 'utf-8'),
) as TestScenario;

function record(sessionNumber: number, files: Record<string, string>): SessionRecord {
  return createSessionRecord({
    id: `rec-${sessionNumber}`,
    scenarioId: 'event-sourced-inventory',
    sessionNumber,
    harness: 'claude-code',
    agentOutput: '',
    filesModified: [],
    transcript: '',
    workspaceSnapshot: {
      capturedAt: '2026-03-21T10:05:00Z',
      files: Object.entries(files).map(([path, content]) => ({ path, content })),
    },
    startedAt: '2026-03-21T10:00:00Z',
    completedAt: '2026-03-21T10:05:00Z',
  });
}

describe('event-sourced-inventory authored structural assertions', () => {
  it('declares structural assertions with unique ids and in-range session numbers', () => {
    const assertions = scenario.structuralAssertions ?? [];
    expect(assertions.length).toBeGreaterThan(0);

    const ids = new Set<string>();
    for (const a of assertions) {
      expect(a.id).toBeTruthy();
      expect(ids.has(a.id)).toBe(false);
      ids.add(a.id);
      expect(a.sessionNumber).toBeGreaterThanOrEqual(1);
      expect(a.sessionNumber).toBeLessThanOrEqual(scenario.sessionCount);
    }
  });

  it('is fully satisfied by a correct cumulative implementation', () => {
    const assertions = scenario.structuralAssertions as readonly StructuralAssertion[];

    // A correct event-sourced implementation as it would look by each due session.
    // Workspaces are cumulative: later sessions retain earlier artefacts plus the
    // disruption-driven additions (metadata at s3, concurrency control at s5).
    const typesWithMetadata = `
      export interface EventMetadata { correlationId: string; causationId: string; timestamp: number; }
      export type DomainEvent =
        | { type: 'ProductAdded'; metadata: EventMetadata }
        | { type: 'StockReceived'; metadata: EventMetadata }
        | { type: 'StockReserved'; metadata: EventMetadata };
    `;
    const store = `export class EventStore { append(e: DomainEvent) { this.events.push(e); } }`;
    const projection = `export function project(events: DomainEvent[]) { return {}; }`;
    const handlersWithConcurrency = `
      export class ConcurrencyError extends Error {}
      export function handle(cmd: { expectedVersion: number }) {
        if (cmd.expectedVersion !== current) throw new ConcurrencyError();
      }
    `;

    const records = [
      record(1, {
        'src/events/types.ts': typesWithMetadata,
        'src/events/store.ts': store,
        'src/projections/inventory.ts': projection,
      }),
      record(3, {
        'src/events/types.ts': typesWithMetadata,
        'src/events/store.ts': store,
        'src/projections/inventory.ts': projection,
      }),
      record(5, {
        'src/events/types.ts': typesWithMetadata,
        'src/events/store.ts': store,
        'src/projections/inventory.ts': projection,
        'src/commands/handlers.ts': handlersWithConcurrency,
      }),
      record(7, {
        'src/events/types.ts': typesWithMetadata,
        'src/events/store.ts': store,
        'src/projections/inventory.ts': projection,
        'src/commands/handlers.ts': handlersWithConcurrency,
      }),
    ];

    const score = scoreStructuralAssertions(records, assertions);
    expect(score.score).toBe(1);
  });

  it('is not satisfied when the implementation is empty', () => {
    const assertions = scenario.structuralAssertions as readonly StructuralAssertion[];
    const records = [record(1, {}), record(3, {}), record(5, {}), record(7, {})];
    const score = scoreStructuralAssertions(records, assertions);
    expect(score.score).toBe(0);
  });
});
