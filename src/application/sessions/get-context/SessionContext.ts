import { SessionSummaryProjection } from "../SessionSummaryView.js";
import { GoalView } from "../../goals/GoalView.js";
import { ProjectView } from "../../project/ProjectView.js";
import { AudienceView } from "../../audiences/AudienceView.js";
import { AudiencePainView } from "../../audience-pains/AudiencePainView.js";

/**
 * SessionContext - Event-agnostic base model for session orientation context
 *
 * Contains the common data needed across all session events (start, resume, etc.).
 * The application layer assembles this from multiple projection stores,
 * keeping the presentation layer free from repository orchestration concerns.
 */
export interface SessionContext {
  /**
   * Project context with audiences and pains.
   * Null if project hasn't been initialized.
   */
  readonly projectContext: SessionProjectContext | null;

  /**
   * Summary of the most recent session (historical context).
   * Null if this is the first-ever session (brownfield project scenario).
   */
  readonly latestSessionSummary: SessionSummaryProjection | null;

  /**
   * Goals currently being worked on (status='doing'/'paused'/'blocked').
   */
  readonly inProgressGoals: GoalView[];

  /**
   * Goals available to work on next (status='to-do').
   */
  readonly plannedGoals: GoalView[];

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
