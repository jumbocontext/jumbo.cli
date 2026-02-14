/**
 * Integration Test: Session Context Rendering
 *
 * This test verifies the complete flow of session context rendering:
 * 1. Start a session
 * 2. Complete goals and add decisions (via events)
 * 3. Verify that the SessionSummary projection is built correctly
 * 4. Verify that queries can retrieve the context
 *
 * This tests the cross-aggregate projection (SessionSummary) and
 * the query/rendering pipeline.
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import fs from "fs-extra";
import path from "path";
import Database from "better-sqlite3";
import { Host } from "../../src/infrastructure/host/Host.js";
import { IApplicationContainer } from "../../src/application/host/IApplicationContainer.js";
import { GetLatestSessionSummaryQueryHandler } from "../../src/application/context/sessions/get-context/GetLatestSessionSummaryQueryHandler.js";

describe("Integration: Session Context Rendering", () => {
  const testRoot = path.join(process.cwd(), ".jumbo-integration-test");
  let host: Host | null = null;
  let container: IApplicationContainer | null = null;

  beforeEach(async () => {
    // Clean up test directory
    await fs.remove(testRoot);
    await fs.ensureDir(testRoot);
    await fs.ensureDir(path.join(testRoot, "events"));
  });

  afterEach(async () => {
    // LocalInfrastructureModule handles cleanup via signal handlers in production.
    // For tests, we need to manually close the db connection since the process doesn't exit.
    if (host) {
      host.dispose();
      host = null;
      container = null;
    }
    // Wait for Windows to release file locks on WAL files
    await new Promise((resolve) => setTimeout(resolve, 100));
    await fs.remove(testRoot);
  });

  it("should render session context with completed goals and decisions from previous session", async () => {
    // ============================================================
    // STEP 1: Start first session (publish SessionStarted event)
    // ============================================================
    host = new Host(testRoot);
    const builder = host.createBuilder();
    container = await builder.build();

    const sessionId = "session_test_123";
    const goalId = "goal_test_456";
    const decisionId = "decision_test_789";

    // Publish SessionStarted event
    await container.eventBus.publish({
      type: "SessionStartedEvent",
      aggregateId: sessionId,
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        focus: "Implement authentication",
        contextSnapshot: null,
      },
    });

    // ============================================================
    // STEP 2: Add and complete a goal (publish Goal events)
    // ============================================================

    // GoalAddedEvent
    await container.eventBus.publish({
      type: "GoalAddedEvent",
      aggregateId: goalId,
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        objective: "Setup JWT authentication",
        successCriteria: ["Users can login with JWT tokens"],
        scopeIn: ["Login endpoint", "Token validation"],
        scopeOut: ["Social auth"],
        
        status: "to-do",
      },
    });

    // GoalCompletedEvent
    await container.eventBus.publish({
      type: "GoalCompletedEvent",
      aggregateId: goalId,
      version: 2,
      timestamp: new Date().toISOString(),
      payload: {
        status: "completed",
      },
    });

    // ============================================================
    // STEP 3: Add a decision (publish DecisionAdded event)
    // ============================================================

    await container.eventBus.publish({
      type: "DecisionAddedEvent",
      aggregateId: decisionId,
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        title: "Use jsonwebtoken library",
        context: "JWT implementation choice",
        rationale: "Well-tested and widely adopted",
        alternatives: ["jose", "custom implementation"],
        consequences: "Dependency on external library",
      },
    });

    // ============================================================
    // STEP 4: End the session (publish SessionEnded event)
    // ============================================================

    await container.eventBus.publish({
      type: "SessionEndedEvent",
      aggregateId: sessionId,
      version: 2,
      timestamp: new Date().toISOString(),
      payload: {
        focus: "Implement authentication",
        summary: "Completed JWT authentication implementation",
      },
    });

    // Wait a bit for projections to update (event handlers are async)
    await new Promise((resolve) => setTimeout(resolve, 200));

    // ============================================================
    // STEP 5: Query for latest session summary
    // ============================================================

    const getLatestSessionSummary = new GetLatestSessionSummaryQueryHandler(
      container.sessionSummaryProjectionStore
    );

    const latestSessionSummary = await getLatestSessionSummary.execute();

    // ============================================================
    // STEP 6: Verify session context is available
    // ============================================================

    expect(latestSessionSummary).not.toBeNull();
    expect(latestSessionSummary?.focus).toBe("Implement authentication");
    expect(latestSessionSummary?.status).toBe("ended");

    // Verify completed goals are in the summary
    expect(latestSessionSummary?.completedGoals).toHaveLength(1);
    expect(latestSessionSummary?.completedGoals[0].objective).toBe(
      "Setup JWT authentication"
    );

    // Verify decisions are in the summary
    expect(latestSessionSummary?.decisions).toHaveLength(1);
    expect(latestSessionSummary?.decisions[0].title).toBe(
      "Use jsonwebtoken library"
    );
    expect(latestSessionSummary?.decisions[0].rationale).toBe(
      "Well-tested and widely adopted"
    );

    // Verify blockers are empty (we didn't encounter any)
    expect(latestSessionSummary?.blockersEncountered).toHaveLength(0);
  });

  it("should handle starting new session with no previous context", async () => {
    // ============================================================
    // Fresh start - no previous sessions
    // ============================================================
    host = new Host(testRoot);
    const builder = host.createBuilder();
    container = await builder.build();

    const getLatestSessionSummary = new GetLatestSessionSummaryQueryHandler(
      container.sessionSummaryProjectionStore
    );

    const latestSessionSummary = await getLatestSessionSummary.execute();

    // No previous session should exist
    expect(latestSessionSummary).toBeNull();
  });
});
