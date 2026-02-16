import { describe, it, expect } from "@jest/globals";
import { SessionResumeContextEnricher } from "../../../../../src/application/context/sessions/get/SessionResumeContextEnricher.js";
import { SessionContext } from "../../../../../src/application/context/sessions/get/SessionContext.js";
import { GoalView } from "../../../../../src/application/context/goals/GoalView.js";
import { GoalStatus } from "../../../../../src/domain/goals/Constants.js";

describe("SessionResumeContextEnricher", () => {
  const enricher = new SessionResumeContextEnricher();

  function createBaseContext(
    overrides: Partial<SessionContext> = {}
  ): SessionContext {
    return {
      sessionId: null,
      status: null,
      focus: null,
      startedAt: null,
      projectContext: null,
      activeGoals: [],
      pausedGoals: [],
      plannedGoals: [],
      recentDecisions: [],
      hasSolutionContext: true,
      ...overrides,
    };
  }

  it("should set scope to work-resume", () => {
    const context = createBaseContext();
    const result = enricher.enrich(context);

    expect(result.scope).toBe("work-resume");
  });

  it("should preserve all base context fields", () => {
    const context = createBaseContext({
      sessionId: "session-1",
      hasSolutionContext: true,
      activeGoals: [{ goalId: "g1" } as GoalView],
      plannedGoals: [{ goalId: "g2" } as GoalView],
    });

    const result = enricher.enrich(context);

    expect(result.projectContext).toBe(context.projectContext);
    expect(result.sessionId).toBe(context.sessionId);
    expect(result.activeGoals).toBe(context.activeGoals);
    expect(result.pausedGoals).toBe(context.pausedGoals);
    expect(result.plannedGoals).toBe(context.plannedGoals);
    expect(result.hasSolutionContext).toBe(context.hasSolutionContext);
  });

  it("should include resume-continuation-prompt instruction", () => {
    const context = createBaseContext();
    const result = enricher.enrich(context);

    expect(result.instructions).toContain("resume-continuation-prompt");
  });

  it("should include paused-goals-context when paused goals exist", () => {
    const context = createBaseContext({
      pausedGoals: [
        {
          goalId: "goal_123",
          objective: "Paused goal",
          status: GoalStatus.PAUSED,
        } as GoalView,
      ],
    });

    const result = enricher.enrich(context);

    expect(result.instructions).toContain("paused-goals-context");
  });

  it("should not include paused-goals-context when no paused goals", () => {
    const context = createBaseContext({ pausedGoals: [] });
    const result = enricher.enrich(context);

    expect(result.instructions).not.toContain("paused-goals-context");
  });
});
