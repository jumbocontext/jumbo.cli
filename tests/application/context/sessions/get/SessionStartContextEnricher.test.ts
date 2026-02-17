import { describe, it, expect } from "@jest/globals";
import { SessionStartContextEnricher } from "../../../../../src/application/context/sessions/get/SessionStartContextEnricher.js";
import { ContextualSessionView } from "../../../../../src/application/context/sessions/get/ContextualSessionView.js";
import { GoalView } from "../../../../../src/application/context/goals/GoalView.js";

describe("SessionStartContextEnricher", () => {
  const enricher = new SessionStartContextEnricher();

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

  it("should set scope to session-start", () => {
    const view = createBaseView();
    const result = enricher.enrich(view);

    expect(result.scope).toBe("session-start");
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
    expect(result.context.recentDecisions).toBe(view.context.recentDecisions);
    expect(result.context.hasSolutionContext).toBe(view.context.hasSolutionContext);
  });

  it("should include goal-selection-prompt instruction", () => {
    const view = createBaseView();
    const result = enricher.enrich(view);

    expect(result.instructions).toContain("goal-selection-prompt");
  });

  it("should include brownfield-onboarding when no solution context exists", () => {
    const view = createBaseView({ hasSolutionContext: false });
    const result = enricher.enrich(view);

    expect(result.instructions).toContain("brownfield-onboarding");
  });

  it("should not include brownfield-onboarding when solution context exists", () => {
    const view = createBaseView({ hasSolutionContext: true });
    const result = enricher.enrich(view);

    expect(result.instructions).not.toContain("brownfield-onboarding");
  });

  it("should include paused-goals-resume when paused goals exist", () => {
    const view = createBaseView({
      pausedGoals: [
        {
          goalId: "goal_123",
          objective: "Paused task",
          status: "paused",
        } as GoalView,
      ],
    });
    const result = enricher.enrich(view);

    expect(result.instructions).toContain("paused-goals-resume");
  });

  it("should not include paused-goals-resume when no goals are paused", () => {
    const view = createBaseView({ pausedGoals: [] });
    const result = enricher.enrich(view);

    expect(result.instructions).not.toContain("paused-goals-resume");
  });
});
