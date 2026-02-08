import { describe, it, expect } from "@jest/globals";
import { SessionResumeContextEnricher } from "../../../../src/application/sessions/get-context/SessionResumeContextEnricher.js";
import { SessionContext } from "../../../../src/application/sessions/get-context/SessionContext.js";
import { GoalStatus } from "../../../../src/domain/goals/Constants.js";

describe("SessionResumeContextEnricher", () => {
  const enricher = new SessionResumeContextEnricher();

  function createBaseContext(
    overrides: Partial<SessionContext> = {}
  ): SessionContext {
    return {
      projectContext: null,
      latestSessionSummary: null,
      inProgressGoals: [],
      plannedGoals: [],
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
      hasSolutionContext: true,
      inProgressGoals: [{ goalId: "g1" } as any],
      plannedGoals: [{ goalId: "g2" } as any],
    });

    const result = enricher.enrich(context);

    expect(result.projectContext).toBe(context.projectContext);
    expect(result.latestSessionSummary).toBe(context.latestSessionSummary);
    expect(result.inProgressGoals).toBe(context.inProgressGoals);
    expect(result.plannedGoals).toBe(context.plannedGoals);
    expect(result.hasSolutionContext).toBe(context.hasSolutionContext);
  });

  it("should include resume-continuation-prompt instruction", () => {
    const context = createBaseContext();
    const result = enricher.enrich(context);

    expect(result.instructions).toContain("resume-continuation-prompt");
  });

  it("should include paused-goals-context when in-progress goals include paused goals", () => {
    const context = createBaseContext({
      inProgressGoals: [
        {
          goalId: "goal_123",
          objective: "Paused goal",
          status: GoalStatus.PAUSED,
        } as any,
      ],
    });

    const result = enricher.enrich(context);

    expect(result.instructions).toContain("paused-goals-context");
  });

  it("should not include paused-goals-context when no paused goals in progress", () => {
    const context = createBaseContext({
      inProgressGoals: [
        {
          goalId: "goal_123",
          objective: "Active goal",
          status: GoalStatus.DOING,
        } as any,
      ],
    });

    const result = enricher.enrich(context);

    expect(result.instructions).not.toContain("paused-goals-context");
  });

  it("should not include paused-goals-context when no in-progress goals", () => {
    const context = createBaseContext({ inProgressGoals: [] });
    const result = enricher.enrich(context);

    expect(result.instructions).not.toContain("paused-goals-context");
  });
});
