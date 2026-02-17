import { describe, it, expect } from "@jest/globals";
import { SessionResumeContextEnricher } from "../../../../../src/application/context/sessions/get/SessionResumeContextEnricher.js";
import { ContextualSessionView } from "../../../../../src/application/context/sessions/get/ContextualSessionView.js";
import { GoalView } from "../../../../../src/application/context/goals/GoalView.js";
import { GoalStatus } from "../../../../../src/domain/goals/Constants.js";

describe("SessionResumeContextEnricher", () => {
  const enricher = new SessionResumeContextEnricher();

  function createBaseView(
    overrides: Partial<ContextualSessionView["context"]> = {}
  ): ContextualSessionView {
    return {
      session: null,
      context: {
        projectContext: null,
        activeGoals: [],
        pausedGoals: [],
        plannedGoals: [],
        recentDecisions: [],
        hasSolutionContext: true,
        ...overrides,
      },
    };
  }

  it("should set scope to work-resume", () => {
    const view = createBaseView();
    const result = enricher.enrich(view);

    expect(result.scope).toBe("work-resume");
  });

  it("should preserve session and context fields", () => {
    const view = createBaseView({
      hasSolutionContext: true,
      activeGoals: [{ goalId: "g1" } as GoalView],
      plannedGoals: [{ goalId: "g2" } as GoalView],
    });

    const result = enricher.enrich(view);

    expect(result.session).toBe(view.session);
    expect(result.context.projectContext).toBe(view.context.projectContext);
    expect(result.context.activeGoals).toBe(view.context.activeGoals);
    expect(result.context.pausedGoals).toBe(view.context.pausedGoals);
    expect(result.context.plannedGoals).toBe(view.context.plannedGoals);
    expect(result.context.hasSolutionContext).toBe(view.context.hasSolutionContext);
  });

  it("should include resume-continuation-prompt instruction", () => {
    const view = createBaseView();
    const result = enricher.enrich(view);

    expect(result.instructions).toContain("resume-continuation-prompt");
  });

  it("should include paused-goals-context when paused goals exist", () => {
    const view = createBaseView({
      pausedGoals: [
        {
          goalId: "goal_123",
          objective: "Paused goal",
          status: GoalStatus.PAUSED,
        } as GoalView,
      ],
    });

    const result = enricher.enrich(view);

    expect(result.instructions).toContain("paused-goals-context");
  });

  it("should not include paused-goals-context when no paused goals", () => {
    const view = createBaseView({ pausedGoals: [] });
    const result = enricher.enrich(view);

    expect(result.instructions).not.toContain("paused-goals-context");
  });
});
