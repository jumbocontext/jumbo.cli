/**
 * Tests for SessionStartOutputBuilder
 *
 * Verifies the top-level session start output composition:
 * - Human-readable output includes all context and goal sections
 * - Goals are grouped by status (not split into inProgress/planned)
 * - Structured output contains per-state grouping with hints
 * - @LLM prompts are preserved in both modes
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { SessionStartOutputBuilder } from "../../../../../../src/presentation/cli/commands/sessions/start/SessionStartOutputBuilder.js";
import { EnrichedSessionContext } from "../../../../../../src/application/context/sessions/get/EnrichedSessionContext.js";
import { SessionContext } from "../../../../../../src/application/context/sessions/get/SessionContext.js";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView.js";
import { DecisionView } from "../../../../../../src/application/context/decisions/DecisionView.js";
import { SessionView } from "../../../../../../src/application/context/sessions/SessionView.js";

describe("SessionStartOutputBuilder", () => {
  let builder: SessionStartOutputBuilder;

  beforeEach(() => {
    builder = new SessionStartOutputBuilder();
  });

  const defaultSession: SessionView = {
    sessionId: "session-1",
    status: "active",
    focus: "Test session",
    contextSnapshot: null,
    version: 1,
    startedAt: "2025-01-01T10:00:00Z",
    endedAt: null,
    createdAt: "2025-01-01T10:00:00Z",
    updatedAt: "2025-01-01T10:00:00Z",
  };

  function createContext(
    contextOverrides: Partial<SessionContext> = {},
    session: SessionView | null = defaultSession,
    instructions: string[] = []
  ): EnrichedSessionContext {
    return {
      session,
      context: {
        projectContext: null,
        activeGoals: [],
        pausedGoals: [],
        plannedGoals: [],
        recentDecisions: [],
        deactivatedRelations: { count: 0, summary: "No deactivated relations." },
        ...contextOverrides,
      },
      instructions,
      scope: "session-start",
    };
  }

  describe("buildSessionStartOutput", () => {
    it("should include session context in output", () => {
      const context = createContext();
      const output = builder.buildSessionStartOutput(context);
      const text = output.toHumanReadable();

      expect(text).toContain("status: active");
    });

    it("should group goals by status from all sources", () => {
      const context = createContext({
        activeGoals: [{ goalId: "g_active", objective: "Active task", status: "doing" } as GoalView],
        pausedGoals: [{ goalId: "g_paused", objective: "Paused task", status: "paused", updatedAt: "2025-01-01T11:00:00Z" } as GoalView],
        plannedGoals: [{ goalId: "g_planned", objective: "Planned task", status: "defined" } as GoalView],
      });

      const output = builder.buildSessionStartOutput(context);
      const text = output.toHumanReadable();

      expect(text).toContain("doing:");
      expect(text).toContain("goalId: g_active");
      expect(text).toContain("paused:");
      expect(text).toContain("goalId: g_paused");
      expect(text).toContain("defined:");
      expect(text).toContain("goalId: g_planned");
    });

    it("should include @LLM goal start instruction", () => {
      const context = createContext();
      const output = builder.buildSessionStartOutput(context);
      const text = output.toHumanReadable();

      expect(text).toContain("@LLM:");
    });

    it("should include paused goals resume prompt when goals are paused", () => {
      const context = createContext({
        pausedGoals: [
          { goalId: "g_paused", objective: "Paused work", status: "paused", updatedAt: "2025-01-01T11:00:00Z" } as GoalView,
        ],
      });

      const output = builder.buildSessionStartOutput(context);
      const text = output.toHumanReadable();

      expect(text).toContain("Goals were paused");
      expect(text).toContain("jumbo goal resume --id");
    });

    it("should include brownfield instruction when brownfield-onboarding present", () => {
      const context = createContext({}, defaultSession, ["brownfield-onboarding"]);
      const output = builder.buildSessionStartOutput(context);
      const text = output.toHumanReadable();

      expect(text).toContain("BROWNFIELD PROJECT");
    });
  });

  describe("buildStructuredOutput", () => {
    it("should include per-state grouped goals instead of inProgress/planned split", () => {
      const context = createContext({
        activeGoals: [{ goalId: "g1", objective: "Active", status: "doing", createdAt: "2025-01-01T10:00:00Z" } as GoalView],
        plannedGoals: [{ goalId: "g2", objective: "Planned", status: "defined", createdAt: "2025-01-01T10:00:00Z" } as GoalView],
      });

      const result = builder.buildStructuredOutput(context, "session-123");

      expect(result).toHaveProperty("goals");
      expect(result).not.toHaveProperty("inProgressGoals");
      expect(result).not.toHaveProperty("plannedGoals");
      expect(result.goals).toHaveProperty("doing");
      expect(result.goals).toHaveProperty("defined");
      expect(result.goals.doing.hint).toBe("jumbo goal submit --id <id>");
    });

    it("should include all expected top-level fields", () => {
      const context = createContext();
      const result = builder.buildStructuredOutput(context, "session-123");

      expect(result).toHaveProperty("projectContext");
      expect(result).toHaveProperty("sessionContext");
      expect(result).toHaveProperty("goals");
      expect(result).toHaveProperty("llmInstructions");
      expect(result).toHaveProperty("sessionStart");
    });

    it("should include session ID in sessionStart field", () => {
      const context = createContext();
      const result = builder.buildStructuredOutput(context, "session-456");

      expect(result.sessionStart).toEqual({ sessionId: "session-456" });
    });

    it("should include llm instructions with session context and goal start", () => {
      const context = createContext({
        pausedGoals: [
          { goalId: "g1", objective: "Paused", status: "paused", updatedAt: "2025-01-01T11:00:00Z" } as GoalView,
        ],
      });

      const result = builder.buildStructuredOutput(context, "session-789");

      expect(result.llmInstructions.sessionContext).toContain("Goals were paused");
      expect(result.llmInstructions.goalStart).toContain("@LLM:");
    });

    it("should have null sessionContext instruction when no paused goals", () => {
      const context = createContext();
      const result = builder.buildStructuredOutput(context, "session-000");

      expect(result.llmInstructions.sessionContext).toBeNull();
    });
  });
});
