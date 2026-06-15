/**
 * The pre-seeded Jumbo plan: architectural context the framework registers via
 * the jumbo CLI (after `jumbo init`, before session 1) plus the progressively
 * released goals. The framework plays the developer role — it stamps starting
 * context and picks which goal is active per session; the agent merely executes
 * the lifecycle on whichever goal-id it was handed.
 */

/**
 * Pre-seeded memory entry to register via the jumbo CLI after `jumbo init`
 * and before session 1. The framework plays the developer role: it stamps
 * the project's starting architectural context so the agent inherits it
 * rather than discovering it from the prompt alone.
 *
 * `planRef` is a plan-local identifier used by JumboPlanRelation.fromRef /
 * toRef to link entities that don't exist yet (the real IDs are minted by
 * the CLI at registration time). It is not sent to Jumbo.
 */
export type JumboPlanEntry =
  | JumboPlanDecisionEntry
  | JumboPlanComponentEntry
  | JumboPlanInvariantEntry
  | JumboPlanDependencyEntry
  | JumboPlanRelationEntry;

export interface JumboPlanDecisionEntry {
  readonly kind: 'decision';
  readonly planRef?: string;
  readonly title: string;
  readonly context: string;
  readonly rationale?: string;
  readonly alternatives?: readonly string[];
  readonly consequences?: string;
}

export type JumboComponentType = 'service' | 'db' | 'queue' | 'ui' | 'lib' | 'api' | 'worker' | 'cache' | 'storage';

export interface JumboPlanComponentEntry {
  readonly kind: 'component';
  readonly planRef?: string;
  readonly name: string;
  readonly type: JumboComponentType;
  readonly description: string;
  readonly responsibility: string;
  readonly path: string;
}

export interface JumboPlanInvariantEntry {
  readonly kind: 'invariant';
  readonly planRef?: string;
  readonly title: string;
  readonly description: string;
  readonly rationale?: string;
}

export interface JumboPlanDependencyEntry {
  readonly kind: 'dependency';
  readonly planRef?: string;
  readonly name: string;
  readonly ecosystem: string;
  readonly packageName: string;
  readonly versionConstraint?: string;
  readonly endpoint?: string;
  readonly contract?: string;
}

export interface JumboPlanRelationEntry {
  readonly kind: 'relation';
  readonly planRef?: string;
  readonly fromType: string;
  readonly fromId: string;
  readonly toType: string;
  readonly toId: string;
  readonly type: string;
  readonly description: string;
  readonly strength?: 'strong' | 'medium' | 'weak';
}

/**
 * A goal in the plan, tagged with the session at which the framework will
 * register it via `jumbo goal add`. Progressive release: a goal with
 * sessionAvailableFrom: 2 is invisible to the agent during session 1 and
 * becomes the active goal for session 2.
 *
 * The framework picks which goal is active per session (the developer's
 * job); the agent merely executes the lifecycle on whichever goal-id it
 * was handed.
 */
export interface JumboPlanGoal {
  readonly title: string;
  readonly objective: string;
  readonly criteria: readonly string[];
  readonly scopeIn?: readonly string[];
  readonly scopeOut?: readonly string[];
  readonly sessionAvailableFrom: number;
  readonly prerequisitePlanRefs?: readonly string[];
  readonly planRef?: string;
}

export interface JumboPlan {
  readonly preSeededMemory?: readonly JumboPlanEntry[];
  readonly goals: readonly JumboPlanGoal[];
}
