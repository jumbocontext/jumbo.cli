/**
 * Tests for SessionStartTextRenderer session summary output
 *
 * Verifies YAML output structure for session summary including:
 * - Goal lifecycle events (started, paused, resumed)
 * - Resume prompts for paused goals
 * - Token-optimized output (only includes sections when data exists)
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { SessionStartTextRenderer } from "../../../../../../src/presentation/cli/commands/sessions/start/SessionStartTextRenderer.js";
import { SessionSummaryProjection } from "../../../../../../src/application/context/sessions/SessionSummaryView.js";

describe("SessionStartTextRenderer", () => {
  let renderer: SessionStartTextRenderer;

  beforeEach(() => {
    renderer = new SessionStartTextRenderer();
  });

  /**
   * Creates a minimal session summary for testing
   */
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

  describe("goal lifecycle events", () => {
    it("should include goalsStarted section when goals were started", () => {
      const summary = createSessionSummary({
        goalsStarted: [
          {
            goalId: "goal_123",
            objective: "Implement feature X",
            startedAt: "2025-01-01T10:30:00Z",
          },
          {
            goalId: "goal_456",
            objective: "Fix bug Y",
            startedAt: "2025-01-01T11:00:00Z",
          },
        ],
      });

      const result = renderer.renderSessionSummary(summary, true);

      expect(result).toContain("goalsStarted:");
      expect(result).toContain("goalId: goal_123");
      expect(result).toContain("objective: Implement feature X");
      expect(result).toContain("startedAt: 2025-01-01T10:30:00Z");
      expect(result).toContain("goalId: goal_456");
      expect(result).toContain("objective: Fix bug Y");
    });

    it("should omit goalsStarted section when no goals were started", () => {
      const summary = createSessionSummary({
        goalsStarted: [],
      });

      const result = renderer.renderSessionSummary(summary, true);

      expect(result).not.toContain("goalsStarted:");
    });

    it("should include goalsPaused section when goals were paused", () => {
      const summary = createSessionSummary({
        goalsPaused: [
          {
            goalId: "goal_789",
            objective: "Research API options",
            reason: "ContextCompressed",
            note: "Need more information",
            pausedAt: "2025-01-01T11:15:00Z",
          },
        ],
      });

      const result = renderer.renderSessionSummary(summary, true);

      expect(result).toContain("goalsPaused:");
      expect(result).toContain("goalId: goal_789");
      expect(result).toContain("objective: Research API options");
      expect(result).toContain("reason: ContextCompressed");
      expect(result).toContain("note: Need more information");
      expect(result).toContain("pausedAt: 2025-01-01T11:15:00Z");
    });

    it("should handle paused goals without optional note", () => {
      const summary = createSessionSummary({
        goalsPaused: [
          {
            goalId: "goal_abc",
            objective: "Test task",
            reason: "UserInitiated",
            pausedAt: "2025-01-01T11:15:00Z",
          },
        ],
      });

      const result = renderer.renderSessionSummary(summary, true);

      expect(result).toContain("goalsPaused:");
      expect(result).toContain("goalId: goal_abc");
      expect(result).toContain("reason: UserInitiated");
      expect(result).not.toContain("note:");
    });

    it("should include goalsResumed section when goals were resumed", () => {
      const summary = createSessionSummary({
        goalsResumed: [
          {
            goalId: "goal_def",
            objective: "Complete documentation",
            note: "Got the info needed",
            resumedAt: "2025-01-01T12:00:00Z",
          },
        ],
      });

      const result = renderer.renderSessionSummary(summary, true);

      expect(result).toContain("goalsResumed:");
      expect(result).toContain("goalId: goal_def");
      expect(result).toContain("objective: Complete documentation");
      expect(result).toContain("note: Got the info needed");
      expect(result).toContain("resumedAt: 2025-01-01T12:00:00Z");
    });

    it("should handle resumed goals without optional note", () => {
      const summary = createSessionSummary({
        goalsResumed: [
          {
            goalId: "goal_ghi",
            objective: "Deploy service",
            resumedAt: "2025-01-01T12:00:00Z",
          },
        ],
      });

      const result = renderer.renderSessionSummary(summary, true);

      expect(result).toContain("goalsResumed:");
      expect(result).toContain("goalId: goal_ghi");
      expect(result).not.toContain("note:");
    });
  });

  describe("resume prompt for paused goals", () => {
    it("should include @LLM resume prompt when goals are paused", () => {
      const summary = createSessionSummary({
        goalsPaused: [
          {
            goalId: "goal_pause_test",
            objective: "Paused task",
            reason: "ContextCompressed",
            pausedAt: "2025-01-01T11:15:00Z",
          },
        ],
      });

      const result = renderer.renderSessionSummary(summary, true);

      expect(result).toContain("@LLM:");
      expect(result).toContain("Goals were paused in this session");
      expect(result).toContain("jumbo goal resume --goal-id");
    });

    it("should not include @LLM resume prompt when no goals are paused", () => {
      const summary = createSessionSummary({
        goalsPaused: [],
        goalsStarted: [
          {
            goalId: "goal_123",
            objective: "Test",
            startedAt: "2025-01-01T10:30:00Z",
          },
        ],
      });

      const result = renderer.renderSessionSummary(summary, true);

      expect(result).not.toContain("@LLM:");
      expect(result).not.toContain("resume");
    });
  });

  describe("combined lifecycle events", () => {
    it("should include all lifecycle sections when data exists", () => {
      const summary = createSessionSummary({
        goalsStarted: [
          {
            goalId: "goal_1",
            objective: "Task 1",
            startedAt: "2025-01-01T10:00:00Z",
          },
        ],
        goalsPaused: [
          {
            goalId: "goal_2",
            objective: "Task 2",
            reason: "ContextCompressed",
            pausedAt: "2025-01-01T11:00:00Z",
          },
        ],
        goalsResumed: [
          {
            goalId: "goal_3",
            objective: "Task 3",
            resumedAt: "2025-01-01T12:00:00Z",
          },
        ],
        completedGoals: [
          {
            goalId: "goal_4",
            objective: "Task 4",
            status: "completed",
            createdAt: "2025-01-01T09:00:00Z",
          },
        ],
      });

      const result = renderer.renderSessionSummary(summary, true);

      expect(result).toContain("completedGoals:");
      expect(result).toContain("goalsStarted:");
      expect(result).toContain("goalsPaused:");
      expect(result).toContain("goalsResumed:");
    });
  });

  describe("session status", () => {
    it("should include session status in output", () => {
      const summary = createSessionSummary({
        status: "active",
      });

      const result = renderer.renderSessionSummary(summary, true);

      expect(result).toContain("status: active");
    });

    it("should handle paused session status", () => {
      const summary = createSessionSummary({
        status: "paused",
      });

      const result = renderer.renderSessionSummary(summary, true);

      expect(result).toContain("status: paused");
    });
  });

  describe("brownfield project handling", () => {
    it("should return brownfield instructions when no solution context exists", () => {
      const result = renderer.renderSessionSummary(null, false);

      expect(result).toContain("BROWNFIELD PROJECT");
      expect(result).toContain("@LLM:");
      expect(result).toContain("jumbo --help");
    });
  });

  describe("null summary handling", () => {
    it("should return appropriate message when summary is null but solution context exists", () => {
      const result = renderer.renderSessionSummary(null, true);

      expect(result).toContain("No previous session context available");
      expect(result).not.toContain("BROWNFIELD");
    });
  });
});
