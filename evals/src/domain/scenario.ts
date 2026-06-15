/**
 * The durable scenario specification: the task, its disruptions, and the
 * structural assertions used to score it. Shared byte-identically across both
 * setups (Jumbo and baseline) before variant-specific prompt wrapping.
 */

import type { ExpectedJumboMemoryCapture } from './jumbo-memory.js';
import type { JumboPlan } from './jumbo-plan.js';

/**
 * Kinds of mid-project disruption a scenario can inject.
 * - `correction`: a prior implementation was wrong and must be fixed.
 * - `scope-change`: the task's boundaries move (features added/removed).
 * - `new-constraint`: a fresh rule the existing work must now satisfy.
 * - `design-change`: a design decision reverses or supersedes an earlier one
 *   (e.g. "switch from REST to events") — the agent must retrofit prior work to
 *   the new decision, testing whether that decision is retained across sessions.
 */
export type DisruptionType = 'correction' | 'scope-change' | 'new-constraint' | 'design-change';

export interface Disruption {
  readonly type: DisruptionType;
  readonly sessionNumber: number;
  readonly content: string;
  readonly recoveryPatterns: readonly string[];
}

/**
 * A declarative, JSON-expressible check on the content of workspace artefacts.
 * This is the primary knowledge-retention signal (GOAL.md §"Structural
 * assertions vs. keyword matching"): retention is measured on the files the
 * agent actually produced, not on keyword presence in transcripts. Matchers
 * are interpreted by the structural-assertion scorer, so new scenarios declare
 * assertions as data without any scoring-code changes.
 *
 * Matchers operate over the *concatenated content of every workspace file whose
 * path matches `StructuralAssertion.file`* (a glob). `fileExists` only checks
 * presence; the rest additionally require at least one matched file.
 */
export type StructuralMatcher =
  | { readonly kind: 'fileExists' }
  | { readonly kind: 'matchesRegex'; readonly pattern: string; readonly flags?: string }
  | { readonly kind: 'containsAll'; readonly substrings: readonly string[] }
  | { readonly kind: 'containsAny'; readonly substrings: readonly string[] }
  | { readonly kind: 'notContains'; readonly substrings: readonly string[] }
  | { readonly kind: 'exportsSymbol'; readonly symbol: string };

/**
 * One structural check, due in a specific session. `file` is a glob matched
 * against workspace-snapshot paths (`*` matches within a path segment, `**`
 * matches across segments). The scorer evaluates the assertion against the
 * snapshot of session `sessionNumber`.
 */
export interface StructuralAssertion {
  readonly id: string;
  readonly description?: string;
  readonly file: string;
  readonly sessionNumber: number;
  readonly matcher: StructuralMatcher;
}

export interface TestScenario {
  readonly id: string;
  readonly name: string;
  readonly initialPrompt: string;
  readonly continuationPrompt?: string;
  readonly sessionCount: number;
  readonly expectedFiles?: readonly string[];
  readonly retentionPatterns?: readonly string[];
  readonly structuralAssertions?: readonly StructuralAssertion[];
  readonly disruptions?: readonly Disruption[];
  readonly expectedJumboMemoryCaptures?: readonly ExpectedJumboMemoryCapture[];
  readonly jumboPlan?: JumboPlan;
  readonly createdAt: string;
}

export function createTestScenario(params: {
  id: string;
  name: string;
  initialPrompt: string;
  continuationPrompt?: string;
  sessionCount: number;
  expectedFiles?: readonly string[];
  retentionPatterns?: readonly string[];
  structuralAssertions?: readonly StructuralAssertion[];
  disruptions?: readonly Disruption[];
  expectedJumboMemoryCaptures?: readonly ExpectedJumboMemoryCapture[];
  jumboPlan?: JumboPlan;
}): TestScenario {
  if (!params.id) throw new Error('TestScenario requires an id');
  if (!params.name) throw new Error('TestScenario requires a name');
  if (!params.initialPrompt) throw new Error('TestScenario requires an initialPrompt');
  if (params.sessionCount < 1) throw new Error('TestScenario requires sessionCount >= 1');

  if (params.structuralAssertions) {
    const seen = new Set<string>();
    for (const assertion of params.structuralAssertions) {
      if (!assertion.id) {
        throw new Error('TestScenario.structuralAssertions entries require an id');
      }
      if (seen.has(assertion.id)) {
        throw new Error(`TestScenario.structuralAssertions has a duplicate id: ${assertion.id}`);
      }
      seen.add(assertion.id);
      if (!assertion.file) {
        throw new Error(`TestScenario.structuralAssertions[${assertion.id}] requires a file glob`);
      }
      if (
        !Number.isInteger(assertion.sessionNumber) ||
        assertion.sessionNumber < 1 ||
        assertion.sessionNumber > params.sessionCount
      ) {
        throw new Error(
          `TestScenario.structuralAssertions[${assertion.id}] sessionNumber must be an integer in 1..${params.sessionCount} (got ${assertion.sessionNumber})`,
        );
      }
    }
  }

  if (params.jumboPlan) {
    if (params.jumboPlan.goals.length === 0) {
      throw new Error('TestScenario.jumboPlan must declare at least one goal');
    }
    for (const goal of params.jumboPlan.goals) {
      if (
        goal.sessionAvailableFrom < 1 ||
        goal.sessionAvailableFrom > params.sessionCount ||
        !Number.isInteger(goal.sessionAvailableFrom)
      ) {
        throw new Error(
          `TestScenario.jumboPlan goal sessionAvailableFrom must be an integer in 1..${params.sessionCount} (got ${goal.sessionAvailableFrom})`,
        );
      }
    }
  }

  return {
    ...params,
    createdAt: new Date().toISOString(),
  };
}
