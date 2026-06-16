import type {
  DimensionScore,
  SessionRecord,
  StructuralAssertion,
  StructuralMatcher,
} from '../domain/index.js';

/**
 * Pure deterministic scorer for structural assertions — the primary
 * knowledge-retention signal (GOAL.md §"Structural assertions vs. keyword
 * matching"). Each assertion is a declarative check on the workspace artefacts
 * of the session it is due in. Retention is measured on the files the agent
 * actually produced, never on transcript keyword presence, so an agent that
 * merely echoes a prompt cannot score retention it did not implement.
 *
 * A session's retention score is the fraction of assertions due in that session
 * that pass; the aggregate score is the fraction of all assertions that pass in
 * their respective due sessions.
 */

const DIMENSION = 'structural-retention';

/** Converts a restricted glob (`*` within a segment, `**` across segments) to a RegExp. */
function globToRegExp(glob: string): RegExp {
  let out = '';
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i];
    if (ch === '*') {
      if (glob[i + 1] === '*') {
        out += '.*';
        i++;
        // consume a trailing slash so `src/**/x` also matches `src/x`
        if (glob[i + 1] === '/') i++;
      } else {
        out += '[^/]*';
      }
    } else if ('\\^$+?.()|[]{}'.includes(ch)) {
      out += `\\${ch}`;
    } else {
      out += ch;
    }
  }
  return new RegExp(`^${out}$`);
}

interface MatchedFiles {
  readonly paths: readonly string[];
  /** Concatenated content of every matched file. */
  readonly content: string;
}

function matchFiles(record: SessionRecord | undefined, glob: string): MatchedFiles {
  const files = record?.workspaceSnapshot?.files ?? [];
  const re = globToRegExp(glob);
  const matched = files.filter((f) => re.test(f.path));
  return {
    paths: matched.map((f) => f.path),
    content: matched.map((f) => f.content).join('\n'),
  };
}

interface MatcherResult {
  readonly pass: boolean;
  readonly reason?: string;
}

function evaluateMatcher(matcher: StructuralMatcher, matched: MatchedFiles): MatcherResult {
  if (matcher.kind === 'fileExists') {
    return matched.paths.length > 0
      ? { pass: true }
      : { pass: false, reason: 'no file matched glob' };
  }

  // `notContains` is satisfied vacuously when nothing matches; every other
  // matcher needs at least one matched file to evaluate against.
  if (matched.paths.length === 0 && matcher.kind !== 'notContains') {
    return { pass: false, reason: 'no file matched glob' };
  }

  switch (matcher.kind) {
    case 'matchesRegex': {
      let re: RegExp;
      try {
        re = new RegExp(matcher.pattern, matcher.flags);
      } catch (err) {
        return { pass: false, reason: `invalid regex: ${(err as Error).message}` };
      }
      return re.test(matched.content)
        ? { pass: true }
        : { pass: false, reason: `pattern /${matcher.pattern}/ not found` };
    }
    case 'containsAll': {
      const missing = matcher.substrings.filter((s) => !matched.content.includes(s));
      return missing.length === 0
        ? { pass: true }
        : { pass: false, reason: `missing: ${missing.join(', ')}` };
    }
    case 'containsAny': {
      const found = matcher.substrings.some((s) => matched.content.includes(s));
      return found
        ? { pass: true }
        : { pass: false, reason: `none of: ${matcher.substrings.join(', ')}` };
    }
    case 'notContains': {
      const present = matcher.substrings.filter((s) => matched.content.includes(s));
      return present.length === 0
        ? { pass: true }
        : { pass: false, reason: `forbidden present: ${present.join(', ')}` };
    }
    case 'exportsSymbol': {
      const sym = escapeRegExp(matcher.symbol);
      const declared = new RegExp(
        `export\\s+(?:default\\s+)?(?:abstract\\s+)?(?:async\\s+)?(?:class|function|const|let|var|interface|type|enum)\\s+${sym}\\b`,
      );
      const reExported = new RegExp(`export\\s*(?:type\\s*)?\\{[^}]*\\b${sym}\\b[^}]*\\}`);
      return declared.test(matched.content) || reExported.test(matched.content)
        ? { pass: true }
        : { pass: false, reason: `symbol '${matcher.symbol}' not exported` };
    }
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[\\^$+?.()|[\]{}*]/g, '\\$&');
}

function recordForSession(
  records: readonly SessionRecord[],
  sessionNumber: number,
): SessionRecord | undefined {
  return records.find((r) => r.sessionNumber === sessionNumber);
}

interface AssertionOutcome {
  readonly assertion: StructuralAssertion;
  readonly pass: boolean;
  readonly reason?: string;
}

function evaluateAssertion(
  assertion: StructuralAssertion,
  records: readonly SessionRecord[],
): AssertionOutcome {
  const record = recordForSession(records, assertion.sessionNumber);
  if (!record) {
    return { assertion, pass: false, reason: `no record for session ${assertion.sessionNumber}` };
  }
  const matched = matchFiles(record, assertion.file);
  const result = evaluateMatcher(assertion.matcher, matched);
  return { assertion, pass: result.pass, reason: result.reason };
}

/**
 * Aggregate structural-retention score across all assertions, each evaluated
 * against the workspace snapshot of the session it is due in.
 */
export function scoreStructuralAssertions(
  sessionRecords: readonly SessionRecord[],
  assertions: readonly StructuralAssertion[],
): DimensionScore {
  if (assertions.length === 0) {
    return {
      dimension: DIMENSION,
      score: 1,
      maxScore: 1,
      details: 'No structural assertions defined — trivially satisfied',
    };
  }

  const outcomes = assertions.map((a) => evaluateAssertion(a, sessionRecords));
  const passed = outcomes.filter((o) => o.pass).length;
  const failed = outcomes.filter((o) => !o.pass);
  const score = passed / outcomes.length;

  const details = [
    `${passed}/${outcomes.length} structural assertions passed`,
    failed.length > 0
      ? `failed: ${failed.map((o) => `${o.assertion.id} (${o.reason})`).join('; ')}`
      : null,
  ]
    .filter(Boolean)
    .join('; ');

  return {
    dimension: DIMENSION,
    score: Math.round(score * 100) / 100,
    maxScore: 1,
    details,
  };
}

/**
 * Per-session trajectory: one DimensionScore per session that has assertions
 * due, where the score is the fraction of that session's due assertions that
 * pass. Sessions with no assertions due are omitted.
 */
export function scoreStructuralAssertionsTimeline(
  sessionRecords: readonly SessionRecord[],
  assertions: readonly StructuralAssertion[],
): DimensionScore[] {
  if (assertions.length === 0) return [];

  const sessionNumbers = [...new Set(assertions.map((a) => a.sessionNumber))].sort((a, b) => a - b);

  return sessionNumbers.map((sessionNumber) => {
    const due = assertions.filter((a) => a.sessionNumber === sessionNumber);
    const outcomes = due.map((a) => evaluateAssertion(a, sessionRecords));
    const passed = outcomes.filter((o) => o.pass).length;
    const score = passed / due.length;
    return {
      dimension: DIMENSION,
      score: Math.round(score * 100) / 100,
      maxScore: 1,
      details: `session ${sessionNumber}: ${passed}/${due.length} structural assertions passed`,
    };
  });
}
