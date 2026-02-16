import { describe, it, expect } from "@jest/globals";
import { SessionStartContextEnricher } from "../../../../../src/application/context/sessions/get/SessionStartContextEnricher.js";
import { SessionContext } from "../../../../../src/application/context/sessions/get/SessionContext.js";
import { GoalView } from "../../../../../src/application/context/goals/GoalView.js";

describe("SessionStartContextEnricher", () => {
  const enricher = new SessionStartContextEnricher();

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

  it("should set scope to session-start", () => {
    const context = createBaseContext();
    const result = enricher.enrich(context);

    expect(result.scope).toBe("session-start");
  });

  it("should preserve all base context fields", () => {
    const context = createBaseContext({
      sessionId: "session-1",
      status: "active",
      hasSolutionContext: true,
      activeGoals: [{ goalId: "g1" } as GoalView],
      plannedGoals: [{ goalId: "g2" } as GoalView],
    });

    const result = enricher.enrich(context);

    expect(result.sessionId).toBe(context.sessionId);
    expect(result.status).toBe(context.status);
    expect(result.projectContext).toBe(context.projectContext);
    expect(result.activeGoals).toBe(context.activeGoals);
    expect(result.pausedGoals).toBe(context.pausedGoals);
    expect(result.plannedGoals).toBe(context.plannedGoals);
    expect(result.recentDecisions).toBe(context.recentDecisions);
    expect(result.hasSolutionContext).toBe(context.hasSolutionContext);
  });

  it("should include goal-selection-prompt instruction", () => {
    const context = createBaseContext();
    const result = enricher.enrich(context);

    expect(result.instructions).toContain("goal-selection-prompt");
  });

  it("should include brownfield-onboarding when no solution context exists", () => {
    const context = createBaseContext({ hasSolutionContext: false });
    const result = enricher.enrich(context);

    expect(result.instructions).toContain("brownfield-onboarding");
  });

  it("should not include brownfield-onboarding when solution context exists", () => {
    const context = createBaseContext({ hasSolutionContext: true });
    const result = enricher.enrich(context);

    expect(result.instructions).not.toContain("brownfield-onboarding");
  });

  it("should include paused-goals-resume when paused goals exist", () => {
    const context = createBaseContext({
      pausedGoals: [
        {
          goalId: "goal_123",
          objective: "Paused task",
          status: "paused",
        } as GoalView,
      ],
    });
    const result = enricher.enrich(context);

    expect(result.instructions).toContain("paused-goals-resume");
  });

  it("should not include paused-goals-resume when no goals are paused", () => {
    const context = createBaseContext({ pausedGoals: [] });
    const result = enricher.enrich(context);

    expect(result.instructions).not.toContain("paused-goals-resume");
  });
});
