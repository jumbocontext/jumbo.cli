/**
 * Tests for SessionContextOutputBuilder
 *
 * Verifies output for session context orientation including:
 * - Project context rendering (name, purpose, audiences, pains)
 * - Session summary (focus, status, paused goals, recent decisions)
 * - Brownfield onboarding @LLM prompt
 * - Paused goals resume @LLM prompt
 * - Deactivated relations warning
 * - Structured output for JSON mode
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { SessionContextOutputBuilder } from "../../../../../../src/presentation/cli/commands/sessions/start/SessionContextOutputBuilder.js";
import { EnrichedSessionContext } from "../../../../../../src/application/context/sessions/get/EnrichedSessionContext.js";
import { SessionContext } from "../../../../../../src/application/context/sessions/get/SessionContext.js";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView.js";
import { DecisionView } from "../../../../../../src/application/context/decisions/DecisionView.js";
import { SessionView } from "../../../../../../src/application/context/sessions/SessionView.js";
import { SessionInstructionSignal } from "../../../../../../src/application/context/sessions/SessionInstructionSignal.js";

describe("SessionContextOutputBuilder", () => {
  let builder: SessionContextOutputBuilder;

  beforeEach(() => {
    builder = new SessionContextOutputBuilder();
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

  describe("buildSessionContext", () => {
    it("should include session status in output", () => {
      const context = createContext();
      const output = builder.buildSessionContext(context);
      const text = output.toHumanReadable();

      expect(text).toContain("status: active");
    });

    it("should include project context when available", () => {
      const context = createContext({
        projectContext: {
          project: { name: "TestProject", purpose: "Testing purposes" },
          audiences: [{ name: "Devs", description: "Software developers", priority: "primary" }],
          audiencePains: [{ title: "Context loss", description: "LLMs lose context" }],
          valuePropositions: [{ title: "Persistent memory", description: "Context survives sessions", benefit: "No re-explaining" }],
        } as any,
      });

      const output = builder.buildSessionContext(context);
      const text = output.toHumanReadable();

      expect(text).toContain("name: TestProject");
      expect(text).toContain("purpose: Testing purposes");
      expect(text).toContain("name: Devs");
      expect(text).toContain("Context loss");
      expect(text).toContain("Persistent memory");
      expect(text).toContain("No re-explaining");
    });

    it("should omit project context section when null", () => {
      const context = createContext({ projectContext: null });
      const output = builder.buildSessionContext(context);
      const text = output.toHumanReadable();

      expect(text).not.toContain("projectContext:");
    });
  });

  describe("paused goals rendering", () => {
    it("should include pausedGoals section when goals are paused", () => {
      const context = createContext({
        pausedGoals: [
          {
            goalId: "goal_789",
            objective: "Research API options",
            status: "paused",
            note: "Need more information",
            updatedAt: "2025-01-01T11:15:00Z",
          } as GoalView,
        ],
      });

      const text = builder.renderSessionSummary(context);

      expect(text).toContain("pausedGoals:");
      expect(text).toContain("goalId: goal_789");
      expect(text).toContain("objective: Research API options");
      expect(text).toContain("note: Need more information");
    });

    it("should handle paused goals without optional note", () => {
      const context = createContext({
        pausedGoals: [
          {
            goalId: "goal_abc",
            objective: "Test task",
            status: "paused",
            updatedAt: "2025-01-01T11:15:00Z",
          } as GoalView,
        ],
      });

      const text = builder.renderSessionSummary(context);

      expect(text).toContain("pausedGoals:");
      expect(text).toContain("goalId: goal_abc");
      expect(text).not.toContain("note:");
    });

    it("should omit pausedGoals section when no goals are paused", () => {
      const context = createContext({ pausedGoals: [] });
      const text = builder.renderSessionSummary(context);

      expect(text).not.toContain("pausedGoals:");
    });
  });

  describe("resume prompt for paused goals", () => {
    it("should include @LLM resume prompt when goals are paused", () => {
      const context = createContext({
        pausedGoals: [
          {
            goalId: "goal_pause_test",
            objective: "Paused task",
            status: "paused",
            updatedAt: "2025-01-01T11:15:00Z",
          } as GoalView,
        ],
      });

      const text = builder.renderSessionSummary(context);

      expect(text).toContain("@LLM:");
      expect(text).toContain("Goals were paused");
      expect(text).toContain("jumbo goal resume --id");
    });

    it("should not include resume prompt when no goals are paused", () => {
      const context = createContext({ pausedGoals: [] });
      const text = builder.renderSessionSummary(context);

      expect(text).not.toContain("Goals were paused");
    });

    it("should frame paused goals with workspace language", () => {
      const context = createContext({
        pausedGoals: [
          {
            goalId: "goal_ws",
            objective: "Workspace task",
            status: "paused",
            updatedAt: "2025-01-01T11:15:00Z",
          } as GoalView,
        ],
      });

      const text = builder.renderSessionSummary(context);

      expect(text).toContain("your workspace");
    });
  });

  describe("brownfield workspace framing", () => {
    it("should frame Jumbo as the LLM's persistent memory in brownfield onboarding", () => {
      const context = createContext({}, defaultSession, [SessionInstructionSignal.BROWNFIELD_ONBOARDING]);
      const text = builder.renderSessionSummary(context);

      expect(text).toContain("your Jumbo workspace");
      expect(text).toContain("your persistent memory");
    });
  });

  describe("primitive gaps nudge", () => {
    it("should include @LLM instruction listing missing primitives when primitive-gaps-detected", () => {
      const context = createContext(
        {
          projectContext: {
            project: { name: "Test", purpose: "Testing" },
            audiences: [],
            audiencePains: [{ title: "Pain1", description: "A pain" }],
            valuePropositions: [],
          } as any,
        },
        defaultSession,
        [SessionInstructionSignal.PRIMITIVE_GAPS_DETECTED]
      );

      const text = builder.renderSessionSummary(context);

      expect(text).toContain("@LLM:");
      expect(text).toContain("Missing: audiences, value propositions");
      expect(text).toContain("jumbo audience add --help");
      expect(text).toContain("jumbo value add --help");
      expect(text).not.toContain("audience pains");
      expect(text).not.toContain("audience-pain add");
    });

    it("should list all three primitives when all are missing", () => {
      const context = createContext(
        {
          projectContext: {
            project: { name: "Test", purpose: "Testing" },
            audiences: [],
            audiencePains: [],
            valuePropositions: [],
          } as any,
        },
        defaultSession,
        [SessionInstructionSignal.PRIMITIVE_GAPS_DETECTED]
      );

      const text = builder.renderSessionSummary(context);

      expect(text).toContain("Missing: audiences, audience pains, value propositions");
      expect(text).toContain("jumbo audience add --help");
      expect(text).toContain("jumbo audience-pain add --help");
      expect(text).toContain("jumbo value add --help");
    });

    it("should not include primitive gaps instruction when signal is absent", () => {
      const context = createContext(
        {
          projectContext: {
            project: { name: "Test", purpose: "Testing" },
            audiences: [],
            audiencePains: [],
            valuePropositions: [],
          } as any,
        },
        defaultSession,
        []
      );

      const text = builder.renderSessionSummary(context);

      expect(text).not.toContain("gaps in its foundational context");
    });

    it("should combine primitive gaps and paused goals instructions", () => {
      const context = createContext(
        {
          projectContext: {
            project: { name: "Test", purpose: "Testing" },
            audiences: [],
            audiencePains: [],
            valuePropositions: [],
          } as any,
          pausedGoals: [
            { goalId: "g1", objective: "Paused", status: "paused", updatedAt: "2025-01-01T11:00:00Z" } as GoalView,
          ],
        },
        defaultSession,
        [SessionInstructionSignal.PRIMITIVE_GAPS_DETECTED]
      );

      const text = builder.renderSessionSummary(context);

      expect(text).toContain("gaps in its foundational context");
      expect(text).toContain("Goals were paused");
    });
  });

  describe("recent decisions rendering", () => {
    it("should include recentDecisions section when decisions exist", () => {
      const context = createContext({
        recentDecisions: [
          {
            decisionId: "dec_1",
            title: "Use PostgreSQL",
            rationale: "Better for our use case",
          } as DecisionView,
        ],
      });

      const text = builder.renderSessionSummary(context);

      expect(text).toContain("recentDecisions:");
      expect(text).toContain("decisionId: dec_1");
      expect(text).toContain("title: Use PostgreSQL");
      expect(text).toContain("rationale: Better for our use case");
    });

    it("should omit recentDecisions section when no decisions exist", () => {
      const context = createContext({ recentDecisions: [] });
      const text = builder.renderSessionSummary(context);

      expect(text).not.toContain("recentDecisions:");
    });
  });

  describe("deactivated relations warning", () => {
    it("should include warning and summary when deactivated relations exist", () => {
      const context = createContext({
        deactivatedRelations: {
          count: 2,
          summary: "decision:dec_1 -> component:comp_1; goal:goal_1 -> decision:dec_1",
        },
      });

      const text = builder.renderSessionSummary(context);

      expect(text).toContain("deactivatedRelations:");
      expect(text).toContain("count: 2");
      expect(text).toContain("warning:");
      expect(text).toContain("Deactivated relations detected");
    });
  });

  describe("brownfield project handling", () => {
    it("should return brownfield instructions when brownfield-onboarding instruction is present", () => {
      const context = createContext({}, defaultSession, [SessionInstructionSignal.BROWNFIELD_ONBOARDING]);
      const text = builder.renderSessionSummary(context);

      expect(text).toContain("BROWNFIELD PROJECT");
      expect(text).toContain("@LLM:");
      expect(text).toContain("jumbo --help");
    });
  });

  describe("null session handling", () => {
    it("should return appropriate message when no active session exists", () => {
      const context = createContext({}, null);
      const text = builder.renderSessionSummary(context);

      expect(text).toContain("No previous session context available");
      expect(text).not.toContain("BROWNFIELD");
    });
  });

  describe("buildStructuredSessionContext", () => {
    it("should return structured data with session context", () => {
      const context = createContext({
        recentDecisions: [
          { decisionId: "dec_1", title: "Use PostgreSQL", rationale: "Better" } as DecisionView,
        ],
      });

      const result = builder.buildStructuredSessionContext(context);

      expect(result.projectContext).toBeNull();
      expect(result.sessionContext).toBeDefined();
      expect(result.llmSessionContextInstruction).toBeNull();
    });

    it("should include llm instruction when goals are paused", () => {
      const context = createContext({
        pausedGoals: [
          { goalId: "g1", objective: "Paused", status: "paused", updatedAt: "2025-01-01T11:00:00Z" } as GoalView,
        ],
      });

      const result = builder.buildStructuredSessionContext(context);

      expect(result.llmSessionContextInstruction).toContain("Goals were paused");
    });

    it("should include brownfield instruction when brownfield-onboarding present", () => {
      const context = createContext({}, defaultSession, [SessionInstructionSignal.BROWNFIELD_ONBOARDING]);

      const result = builder.buildStructuredSessionContext(context);

      expect(result.llmSessionContextInstruction).toContain("BROWNFIELD PROJECT");
    });
  });
});
