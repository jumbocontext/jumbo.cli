/**
 * Shared "fold tamper provenance into a result" behavior. Centralised here so
 * each result type (TestResult, ComparisonResult, and any future ones) derives
 * its `tampered` flag and merged `tamperLog` the same way instead of
 * re-implementing it in every factory.
 */
import type { TamperEvent } from './tamper.js';

export interface TamperProvenance {
  readonly tampered: boolean;
  readonly tamperLog: readonly TamperEvent[];
}

/** Anything that carries its own tamper provenance (a session record, an arm result). */
export interface TamperBearing {
  readonly tampered: boolean;
  readonly tamperLog: readonly TamperEvent[];
}

/**
 * Folds an optional seed (caller-supplied `tampered`/`tamperLog`) together with
 * any number of tamper-bearing sources into a single provenance. A result is
 * tampered if the seed says so or any source is tampered; the log is the seed
 * log followed by each source's log, in order.
 */
export function mergeTamperProvenance(
  seed: { readonly tampered?: boolean; readonly tamperLog?: readonly TamperEvent[] },
  sources: readonly TamperBearing[],
): TamperProvenance {
  const tampered = (seed.tampered ?? false) || sources.some((s) => s.tampered);
  const tamperLog: readonly TamperEvent[] = [
    ...(seed.tamperLog ?? []),
    ...sources.flatMap((s) => s.tamperLog),
  ];
  return { tampered, tamperLog };
}
