import { describe, it, expect } from "@jest/globals";
import { SessionStartContextEnricher } from "../../../../../src/application/context/sessions/get-context/SessionStartContextEnricher.js";
import { SessionContext } from "../../../../../src/application/context/sessions/get-context/SessionContext.js";
import { SessionSummaryProjection } from "../../../../../src/application/context/sessions/SessionSummaryView.js";

describe("SessionStartContextEnricher", () => {
  const enricher = new SessionStartContextEnricher();

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

  function createSessionSummary(
    overrides: Partial<SessionSummaryProjection> = {}
  ): SessionSummaryProjection {
    return {
      sessionId: "LATEST",
      originalSessionId: "session_123",
      focus: "Test session",
      status: "active",
      contextSnapshot: null,
      completedGoals: [],
      blockersEncountered: [],
      decisions: [],
      goalsStarted: [],
      goalsPaused: [],
      goalsResumed: [],
      createdAt: "2025-01-01T10:00:00Z",
      updatedAt: "2025-01-01T10:00:00Z",
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

  it("should include paused-goals-resume when previous session had paused goals", () => {
    const summary = createSessionSummary({
      goalsPaused: [
        {
          goalId: "goal_123",
          objective: "Paused task",
          reason: "ContextCompressed",
          pausedAt: "2025-01-01T11:00:00Z",
        },
      ],
    });
    const context = createBaseContext({ latestSessionSummary: summary });
    const result = enricher.enrich(context);

    expect(result.instructions).toContain("paused-goals-resume");
  });

  it("should not include paused-goals-resume when no goals were paused", () => {
    const summary = createSessionSummary({ goalsPaused: [] });
    const context = createBaseContext({ latestSessionSummary: summary });
    const result = enricher.enrich(context);

    expect(result.instructions).not.toContain("paused-goals-resume");
  });

  it("should not include paused-goals-resume when no previous session exists", () => {
    const context = createBaseContext({ latestSessionSummary: null });
    const result = enricher.enrich(context);

    expect(result.instructions).not.toContain("paused-goals-resume");
  });
});
