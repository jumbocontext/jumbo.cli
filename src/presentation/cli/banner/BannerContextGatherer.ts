/**
 * Banner Context Gatherer
 *
 * Queries projection stores via container to gather all context needed
 * for dynamic banner content generation.
 *
 * This is presentation layer logic - the banner determines what data it needs
 * for display and queries stores directly via the container.
 */

import { IApplicationContainer } from "../../../application/host/IApplicationContainer.js";
import { GoalStatus } from "../../../domain/goals/Constants.js";

/**
 * Aggregated context for banner display
 */
export interface BannerContext {
  /**
   * Project information (null if project not initialized)
   */
  project: {
    name: string;
    purpose: string | null;
  } | null;

  /**
   * Latest session information (null if no sessions exist)
   */
  session: {
    sessionId: string;
    focus: string | null; // Nullable - set at session end
    status: "active" | "paused" | "blocked" | "ended";
    startedAt: string;
  } | null;

  /**
   * Goal counts by status
   */
  goals: {
    planned: number;
    active: number;
    blocked: number;
    completed: number;
  };

  /**
   * Active blockers requiring attention
   */
  blockers: Array<{
    goalId: string;
    objective: string;
    note: string;
  }>;
}

/**
 * Gather banner context from projection stores
 *
 * @param container - Application container with projection stores
 * @returns Aggregated banner context
 */
export async function gatherBannerContext(
  container: IApplicationContainer
): Promise<BannerContext> {
  try {
    // Get project info
    const projectView = await container.projectContextReader.getProject();

    // Get active session
    const activeSession = await container.activeSessionReader.findActive();

    // Get goal counts by status
    const plannedGoals = await container.goalStatusReader.findByStatus(
      GoalStatus.TODO
    );
    const activeGoals = await container.goalStatusReader.findByStatus(
      GoalStatus.DOING
    );
    const blockedGoals = await container.goalStatusReader.findByStatus(
      GoalStatus.BLOCKED
    );
    const completedGoals = await container.goalStatusReader.findByStatus(
      GoalStatus.COMPLETED
    );

    return {
      project: projectView
        ? {
            name: projectView.name,
            purpose: projectView.purpose ?? null,
          }
        : null,
      session: activeSession
        ? {
            sessionId: activeSession.sessionId,
            focus: activeSession.focus,
            status: activeSession.status,
            startedAt: activeSession.startedAt,
          }
        : null,
      goals: {
        planned: plannedGoals.length,
        active: activeGoals.length,
        blocked: blockedGoals.length,
        completed: completedGoals.length,
      },
      blockers: blockedGoals.map((goal: { goalId: string; objective: string; note?: string }) => ({
        goalId: goal.goalId,
        objective: goal.objective,
        note: goal.note ?? "No details provided",
      })),
    };
  } catch (error) {
    // Graceful degradation: if any query fails, return empty context
    return {
      project: null,
      session: null,
      goals: { planned: 0, active: 0, blocked: 0, completed: 0 },
      blockers: [],
    };
  }
}
