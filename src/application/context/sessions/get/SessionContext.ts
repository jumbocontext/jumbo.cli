import { GoalView } from "../../goals/GoalView.js";
import { ProjectView } from "../../project/ProjectView.js";
import { AudienceView } from "../../audiences/AudienceView.js";
import { AudiencePainView } from "../../audience-pains/AudiencePainView.js";
import { DecisionView } from "../../decisions/DecisionView.js";

/**
 * SessionContext - Query-time assembled aggregate for session orientation context
 *
 * Assembled at query time from multiple view readers using the multi-query pattern.
 * No dependency on event-sourced projections — all data is current state from existing read models.
 */
export interface SessionContext {
  /**
   * Session primitives from ISessionViewReader.
   * Null when no active session exists (e.g., first-ever session start).
   */
  readonly sessionId: string | null;
  readonly status: string | null;
  readonly focus: string | null;
  readonly startedAt: string | null;

  /**
   * Project context with audiences and pains.
   * Null if project hasn't been initialized.
   */
  readonly projectContext: SessionProjectContext | null;

  /**
   * Goals currently being actively worked on (status='doing'/'blocked'/'in-review'/'qualified').
   */
  readonly activeGoals: GoalView[];

  /**
   * Goals that are paused (status='paused').
   * Separated from activeGoals for enricher detection (paused-goals-resume signal).
   */
  readonly pausedGoals: GoalView[];

  /**
   * Goals available to work on next (status='to-do'/'refined').
   */
  readonly plannedGoals: GoalView[];

  /**
   * Recent active decisions for context orientation.
   */
  readonly recentDecisions: DecisionView[];

  /**
   * Indicates whether the project has any solution context recorded in Jumbo.
   */
  readonly hasSolutionContext: boolean;
}

/**
 * SessionProjectContext - Combined project context for session orientation
 */
export interface SessionProjectContext {
  readonly project: ProjectView;
  readonly audiences: AudienceView[];
  readonly audiencePains: AudiencePainView[];
}

/**
 * SessionContextView - Enriched session context with event-specific instructions and scope
 *
 * Produced by event-specific enrichers that compose the base SessionContext
 * with targeted LLM instruction signals and scope identification.
 * Extends SessionContext so consumers can access base fields directly.
 */
export interface SessionContextView extends SessionContext {
  /**
   * Event-specific LLM instruction signals indicating what guidance applies.
   * Presentation layer maps these signals to rendered instruction text.
   */
  readonly instructions: string[];

  /**
   * Identifies the session event scope (e.g., "session-start", "work-resume").
   */
  readonly scope: string;
}
