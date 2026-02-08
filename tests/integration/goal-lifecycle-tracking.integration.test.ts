/**
 * Integration Test: Goal Lifecycle Tracking
 *
 * This test verifies the complete flow of goal lifecycle tracking in session summaries:
 * 1. Start a session
 * 2. Start, pause, and resume goals (via events)
 * 3. Verify that the SessionSummary projection tracks lifecycle events
 * 4. Verify that session archival preserves goal lifecycle data
 * 5. Verify that the formatter includes resume prompts for paused goals
 *
 * This tests the cross-aggregate projection for goal lifecycle events.
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import fs from "fs-extra";
import path from "path";
import { Host } from "../../src/infrastructure/host/Host.js";
import { IApplicationContainer } from "../../src/application/host/IApplicationContainer.js";
import { GetLatestSessionSummaryQueryHandler } from "../../src/application/sessions/get-context/GetLatestSessionSummaryQueryHandler.js";
import { SessionStartTextRenderer } from "../../src/presentation/cli/commands/sessions/start/SessionStartTextRenderer.js";

describe("Integration: Goal Lifecycle Tracking", () => {
  const testRoot = path.join(process.cwd(), ".jumbo-goal-lifecycle-test");
  let host: Host | null = null;
  let container: IApplicationContainer | null = null;

  beforeEach(async () => {
    // Clean up test directory
    await fs.remove(testRoot);
    await fs.ensureDir(testRoot);
    await fs.ensureDir(path.join(testRoot, "events"));
  });

  afterEach(async () => {
    if (host) {
      host.dispose();
      host = null;
      container = null;
    }
    // Wait for Windows to release file locks on WAL files
    await new Promise((resolve) => setTimeout(resolve, 100));
    await fs.remove(testRoot);
  });

  it("should track goal started events in session summary", async () => {
    host = new Host(testRoot);
    const builder = host.createBuilder();
    container = await builder.build();

    const sessionId = "session_lifecycle_test_1";
    const goalId = "goal_started_test_1";

    // Start session
    await container.eventBus.publish({
      type: "SessionStartedEvent",
      aggregateId: sessionId,
      version: 1,
      timestamp: "2025-01-01T10:00:00Z",
      payload: {
        focus: "Test goal lifecycle",
        contextSnapshot: null,
      },
    });

    // Add goal
    await container.eventBus.publish({
      type: "GoalAddedEvent",
      aggregateId: goalId,
      version: 1,
      timestamp: "2025-01-01T10:05:00Z",
      payload: {
        objective: "Implement feature X",
        successCriteria: ["Feature X works"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "to-do",
      },
    });

    // Start goal
    await container.eventBus.publish({
      type: "GoalStartedEvent",
      aggregateId: goalId,
      version: 2,
      timestamp: "2025-01-01T10:10:00Z",
      payload: {
        status: "doing",
      },
    });

    // Wait for projections to update
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Query session summary
    const getLatestSessionSummary = new GetLatestSessionSummaryQueryHandler(
      container.sessionSummaryProjectionStore
    );
    const latestSessionSummary = await getLatestSessionSummary.execute();

    // Verify goal started is tracked
    expect(latestSessionSummary).not.toBeNull();
    expect(latestSessionSummary?.goalsStarted).toHaveLength(1);
    expect(latestSessionSummary?.goalsStarted[0].goalId).toBe(goalId);
    expect(latestSessionSummary?.goalsStarted[0].objective).toBe(
      "Implement feature X"
    );
    expect(latestSessionSummary?.goalsStarted[0].startedAt).toBe(
      "2025-01-01T10:10:00Z"
    );
  });

  it("should track goal paused events with reason and note", async () => {
    host = new Host(testRoot);
    const builder = host.createBuilder();
    container = await builder.build();

    const sessionId = "session_lifecycle_test_2";
    const goalId = "goal_paused_test_2";

    // Start session
    await container.eventBus.publish({
      type: "SessionStartedEvent",
      aggregateId: sessionId,
      version: 1,
      timestamp: "2025-01-01T10:00:00Z",
      payload: {
        focus: "Test goal pause",
        contextSnapshot: null,
      },
    });

    // Add and start goal
    await container.eventBus.publish({
      type: "GoalAddedEvent",
      aggregateId: goalId,
      version: 1,
      timestamp: "2025-01-01T10:05:00Z",
      payload: {
        objective: "Research API options",
        successCriteria: ["API selected"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "to-do",
      },
    });

    await container.eventBus.publish({
      type: "GoalStartedEvent",
      aggregateId: goalId,
      version: 2,
      timestamp: "2025-01-01T10:10:00Z",
      payload: {
        status: "doing",
      },
    });

    // Pause goal
    await container.eventBus.publish({
      type: "GoalPausedEvent",
      aggregateId: goalId,
      version: 3,
      timestamp: "2025-01-01T10:15:00Z",
      payload: {
        status: "paused",
        reason: "ContextCompressed",
        note: "Need more information from stakeholders",
      },
    });

    // Wait for projections to update
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Query session summary
    const getLatestSessionSummary = new GetLatestSessionSummaryQueryHandler(
      container.sessionSummaryProjectionStore
    );
    const latestSessionSummary = await getLatestSessionSummary.execute();

    // Verify goal paused is tracked
    expect(latestSessionSummary).not.toBeNull();
    expect(latestSessionSummary?.goalsPaused).toHaveLength(1);
    expect(latestSessionSummary?.goalsPaused[0].goalId).toBe(goalId);
    expect(latestSessionSummary?.goalsPaused[0].objective).toBe(
      "Research API options"
    );
    expect(latestSessionSummary?.goalsPaused[0].reason).toBe("ContextCompressed");
    expect(latestSessionSummary?.goalsPaused[0].note).toBe(
      "Need more information from stakeholders"
    );
    expect(latestSessionSummary?.goalsPaused[0].pausedAt).toBe(
      "2025-01-01T10:15:00Z"
    );
  });

  it("should track goal resumed events", async () => {
    host = new Host(testRoot);
    const builder = host.createBuilder();
    container = await builder.build();

    const sessionId = "session_lifecycle_test_3";
    const goalId = "goal_resumed_test_3";

    // Start session
    await container.eventBus.publish({
      type: "SessionStartedEvent",
      aggregateId: sessionId,
      version: 1,
      timestamp: "2025-01-01T10:00:00Z",
      payload: {
        focus: "Test goal resume",
        contextSnapshot: null,
      },
    });

    // Add, start, pause, and resume goal
    await container.eventBus.publish({
      type: "GoalAddedEvent",
      aggregateId: goalId,
      version: 1,
      timestamp: "2025-01-01T10:05:00Z",
      payload: {
        objective: "Complete documentation",
        successCriteria: ["Docs complete"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "to-do",
      },
    });

    await container.eventBus.publish({
      type: "GoalStartedEvent",
      aggregateId: goalId,
      version: 2,
      timestamp: "2025-01-01T10:10:00Z",
      payload: {
        status: "doing",
      },
    });

    await container.eventBus.publish({
      type: "GoalPausedEvent",
      aggregateId: goalId,
      version: 3,
      timestamp: "2025-01-01T10:15:00Z",
      payload: {
        status: "paused",
        reason: "UserInitiated",
      },
    });

    await container.eventBus.publish({
      type: "GoalResumedEvent",
      aggregateId: goalId,
      version: 4,
      timestamp: "2025-01-01T10:20:00Z",
      payload: {
        status: "doing",
        note: "Got the required information",
      },
    });

    // Wait for projections to update
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Query session summary
    const getLatestSessionSummary = new GetLatestSessionSummaryQueryHandler(
      container.sessionSummaryProjectionStore
    );
    const latestSessionSummary = await getLatestSessionSummary.execute();

    // Verify goal resumed is tracked
    expect(latestSessionSummary).not.toBeNull();
    expect(latestSessionSummary?.goalsResumed).toHaveLength(1);
    expect(latestSessionSummary?.goalsResumed[0].goalId).toBe(goalId);
    expect(latestSessionSummary?.goalsResumed[0].objective).toBe(
      "Complete documentation"
    );
    expect(latestSessionSummary?.goalsResumed[0].note).toBe(
      "Got the required information"
    );
    expect(latestSessionSummary?.goalsResumed[0].resumedAt).toBe(
      "2025-01-01T10:20:00Z"
    );
  });

  it("should preserve goal lifecycle data when archiving session", async () => {
    host = new Host(testRoot);
    const builder = host.createBuilder();
    container = await builder.build();

    const session1Id = "session_archive_test_1";
    const session2Id = "session_archive_test_2";
    const goalId = "goal_archive_test";

    // Start first session
    await container.eventBus.publish({
      type: "SessionStartedEvent",
      aggregateId: session1Id,
      version: 1,
      timestamp: "2025-01-01T10:00:00Z",
      payload: {
        focus: "First session",
        contextSnapshot: null,
      },
    });

    // Add and start goal in first session
    await container.eventBus.publish({
      type: "GoalAddedEvent",
      aggregateId: goalId,
      version: 1,
      timestamp: "2025-01-01T10:05:00Z",
      payload: {
        objective: "Test archival",
        successCriteria: ["Archive works"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "to-do",
      },
    });

    await container.eventBus.publish({
      type: "GoalStartedEvent",
      aggregateId: goalId,
      version: 2,
      timestamp: "2025-01-01T10:10:00Z",
      payload: {
        status: "doing",
      },
    });

    await container.eventBus.publish({
      type: "GoalPausedEvent",
      aggregateId: goalId,
      version: 3,
      timestamp: "2025-01-01T10:15:00Z",
      payload: {
        status: "paused",
        reason: "ContextCompressed",
        note: "Test pause",
      },
    });

    // End first session
    await container.eventBus.publish({
      type: "SessionEndedEvent",
      aggregateId: session1Id,
      version: 2,
      timestamp: "2025-01-01T11:00:00Z",
      payload: {
        focus: "First session",
        summary: "Session ended",
      },
    });

    // Wait for projections to update
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Start second session (should trigger archival)
    await container.eventBus.publish({
      type: "SessionStartedEvent",
      aggregateId: session2Id,
      version: 1,
      timestamp: "2025-01-02T10:00:00Z",
      payload: {
        focus: "Second session",
        contextSnapshot: null,
      },
    });

    // Wait for archival
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Query archived session by original ID
    const archivedSession = await container.sessionSummaryProjectionStore.findByOriginalId(
      session1Id
    );

    // Verify archived session preserves goal lifecycle data
    expect(archivedSession).not.toBeNull();
    expect(archivedSession?.sessionId).toBe(session1Id);
    expect(archivedSession?.goalsStarted).toHaveLength(1);
    expect(archivedSession?.goalsStarted[0].objective).toBe("Test archival");
    expect(archivedSession?.goalsPaused).toHaveLength(1);
    expect(archivedSession?.goalsPaused[0].reason).toBe("ContextCompressed");
    expect(archivedSession?.goalsPaused[0].note).toBe("Test pause");
  });

  it("should include resume prompt in formatter output when goals are paused", async () => {
    host = new Host(testRoot);
    const builder = host.createBuilder();
    container = await builder.build();

    const sessionId = "session_formatter_test";
    const goalId = "goal_formatter_test";

    // Start session
    await container.eventBus.publish({
      type: "SessionStartedEvent",
      aggregateId: sessionId,
      version: 1,
      timestamp: "2025-01-01T10:00:00Z",
      payload: {
        focus: "Test formatter",
        contextSnapshot: null,
      },
    });

    // Add and pause goal
    await container.eventBus.publish({
      type: "GoalAddedEvent",
      aggregateId: goalId,
      version: 1,
      timestamp: "2025-01-01T10:05:00Z",
      payload: {
        objective: "Test formatter goal",
        successCriteria: ["Works"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "to-do",
      },
    });

    await container.eventBus.publish({
      type: "GoalStartedEvent",
      aggregateId: goalId,
      version: 2,
      timestamp: "2025-01-01T10:10:00Z",
      payload: {
        status: "doing",
      },
    });

    await container.eventBus.publish({
      type: "GoalPausedEvent",
      aggregateId: goalId,
      version: 3,
      timestamp: "2025-01-01T10:15:00Z",
      payload: {
        status: "paused",
        reason: "ContextCompressed",
      },
    });

    // Wait for projections to update
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Query and format session summary
    const getLatestSessionSummary = new GetLatestSessionSummaryQueryHandler(
      container.sessionSummaryProjectionStore
    );
    const latestSessionSummary = await getLatestSessionSummary.execute();

    const textRenderer = new SessionStartTextRenderer();
    const formattedOutput = textRenderer.renderSessionSummary(latestSessionSummary, true);

    // Verify formatter includes resume prompt
    expect(formattedOutput).toContain("@LLM:");
    expect(formattedOutput).toContain("Goals were paused in this session");
    expect(formattedOutput).toContain("jumbo goal resume --goal-id");
  });

  it("should track multiple goal lifecycle events in one session", async () => {
    host = new Host(testRoot);
    const builder = host.createBuilder();
    container = await builder.build();

    const sessionId = "session_multiple_test";
    const goal1Id = "goal_multiple_1";
    const goal2Id = "goal_multiple_2";
    const goal3Id = "goal_multiple_3";

    // Start session
    await container.eventBus.publish({
      type: "SessionStartedEvent",
      aggregateId: sessionId,
      version: 1,
      timestamp: "2025-01-01T10:00:00Z",
      payload: {
        focus: "Test multiple goals",
        contextSnapshot: null,
      },
    });

    // Goal 1: Started and completed
    await container.eventBus.publish({
      type: "GoalAddedEvent",
      aggregateId: goal1Id,
      version: 1,
      timestamp: "2025-01-01T10:05:00Z",
      payload: {
        objective: "Goal 1",
        successCriteria: [],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "to-do",
      },
    });

    await container.eventBus.publish({
      type: "GoalStartedEvent",
      aggregateId: goal1Id,
      version: 2,
      timestamp: "2025-01-01T10:10:00Z",
      payload: {
        status: "doing",
      },
    });

    await container.eventBus.publish({
      type: "GoalCompletedEvent",
      aggregateId: goal1Id,
      version: 3,
      timestamp: "2025-01-01T10:15:00Z",
      payload: {
        status: "completed",
      },
    });

    // Goal 2: Started and paused
    await container.eventBus.publish({
      type: "GoalAddedEvent",
      aggregateId: goal2Id,
      version: 1,
      timestamp: "2025-01-01T10:20:00Z",
      payload: {
        objective: "Goal 2",
        successCriteria: [],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "to-do",
      },
    });

    await container.eventBus.publish({
      type: "GoalStartedEvent",
      aggregateId: goal2Id,
      version: 2,
      timestamp: "2025-01-01T10:25:00Z",
      payload: {
        status: "doing",
      },
    });

    await container.eventBus.publish({
      type: "GoalPausedEvent",
      aggregateId: goal2Id,
      version: 3,
      timestamp: "2025-01-01T10:30:00Z",
      payload: {
        status: "paused",
        reason: "ContextCompressed",
      },
    });

    // Goal 3: Started, paused, and resumed
    await container.eventBus.publish({
      type: "GoalAddedEvent",
      aggregateId: goal3Id,
      version: 1,
      timestamp: "2025-01-01T10:35:00Z",
      payload: {
        objective: "Goal 3",
        successCriteria: [],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "to-do",
      },
    });

    await container.eventBus.publish({
      type: "GoalStartedEvent",
      aggregateId: goal3Id,
      version: 2,
      timestamp: "2025-01-01T10:40:00Z",
      payload: {
        status: "doing",
      },
    });

    await container.eventBus.publish({
      type: "GoalPausedEvent",
      aggregateId: goal3Id,
      version: 3,
      timestamp: "2025-01-01T10:45:00Z",
      payload: {
        status: "paused",
        reason: "UserInitiated",
      },
    });

    await container.eventBus.publish({
      type: "GoalResumedEvent",
      aggregateId: goal3Id,
      version: 4,
      timestamp: "2025-01-01T10:50:00Z",
      payload: {
        status: "doing",
      },
    });

    // Wait for projections to update
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Query session summary
    const getLatestSessionSummary = new GetLatestSessionSummaryQueryHandler(
      container.sessionSummaryProjectionStore
    );
    const latestSessionSummary = await getLatestSessionSummary.execute();

    // Verify all lifecycle events are tracked
    expect(latestSessionSummary).not.toBeNull();
    expect(latestSessionSummary?.goalsStarted).toHaveLength(3);
    expect(latestSessionSummary?.completedGoals).toHaveLength(1);
    expect(latestSessionSummary?.goalsPaused).toHaveLength(2);
    expect(latestSessionSummary?.goalsResumed).toHaveLength(1);

    // Verify specific goals
    expect(latestSessionSummary?.goalsStarted.map((g) => g.objective)).toContain(
      "Goal 1"
    );
    expect(latestSessionSummary?.goalsStarted.map((g) => g.objective)).toContain(
      "Goal 2"
    );
    expect(latestSessionSummary?.goalsStarted.map((g) => g.objective)).toContain(
      "Goal 3"
    );
    expect(latestSessionSummary?.completedGoals[0].objective).toBe("Goal 1");
    expect(latestSessionSummary?.goalsPaused.map((g) => g.objective)).toContain(
      "Goal 2"
    );
    expect(latestSessionSummary?.goalsPaused.map((g) => g.objective)).toContain(
      "Goal 3"
    );
    expect(latestSessionSummary?.goalsResumed[0].objective).toBe("Goal 3");
  });
});
