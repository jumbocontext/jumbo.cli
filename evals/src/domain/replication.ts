/**
 * Statistics over K replicated A/B comparisons of the same scenario and harness
 * (GOAL.md Outcome 5). Lift is reported as mean ± standard deviation, never a
 * single-point estimate, and is only a "signal" when it exceeds one standard
 * deviation of its own distribution across replications.
 */

export interface DimensionLiftStat {
  readonly dimension: string;
  /** Total replications in the batch. */
  readonly k: number;
  /** Replications where this dimension was applicable (excludes N/A, e.g. token-efficiency with maxScore 0). */
  readonly applicableReplications: number;
  readonly meanJumbo: number;
  readonly meanBaseline: number;
  /** mean over applicable replications of (jumboScore − baselineScore). */
  readonly meanLift: number;
  /** Sample (n−1) standard deviation of the per-replication lifts; 0 when fewer than 2 applicable. */
  readonly sdLift: number;
  /** meanLift / (sdLift / sqrt(applicable)); 0 when sdLift is 0 or fewer than 2 applicable. */
  readonly tStatistic: number;
  /** True only when |meanLift| > sdLift (GOAL.md: a lift is a signal only when it exceeds one SD). */
  readonly isSignal: boolean;
}

export interface ReplicationSignificance {
  /** The rule used for `isSignal`. */
  readonly rule: string;
  /** One-tailed α=0.05 critical t for df = k−1, or null when df is outside the lookup table. */
  readonly tCriticalOneTailed05: number | null;
  readonly note: string;
}

export interface ReplicationReport {
  readonly scenarioId: string;
  readonly harness: string;
  /** Number of replications aggregated. */
  readonly k: number;
  readonly dimensions: readonly DimensionLiftStat[];
  readonly significance: ReplicationSignificance;
  readonly createdAt: string;
}
