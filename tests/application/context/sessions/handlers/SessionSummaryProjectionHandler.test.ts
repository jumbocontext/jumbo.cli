/**
 * Tests for SessionSummaryProjectionHandler
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { SessionSummaryProjectionHandler } from "../../../../../src/application/context/sessions/get-context/SessionSummaryProjectionHandler.js";
import { ISessionSummaryProjectionStore } from "../../../../../src/application/context/sessions/get-context/ISessionSummaryProjectionStore.js";
import { IGoalReadForSessionSummary } from "../../../../../src/application/context/sessions/get-context/IGoalReadForSessionSummary.js";
import { IDecisionSessionReader } from "../../../../../src/application/context/sessions/get-context/IDecisionSessionReader.js";
import { IEventBus } from "../../../../../src/application/messaging/IEventBus.js";
import { SessionSummaryProjection } from "../../../../../src/application/context/sessions/SessionSummaryView.js";
import { GoalView } from "../../../../../src/application/context/goals/GoalView.js";
import { DecisionView } from "../../../../../src/application/context/decisions/DecisionView.js";

describe("SessionSummaryProjectionHandler", () => {
  let handler: SessionSummaryProjectionHandler;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockStore: jest.Mocked<ISessionSummaryProjectionStore>;
  let mockGoalReader: jest.Mocked<IGoalReadForSessionSummary>;
  let mockDecisionReader: jest.Mocked<IDecisionSessionReader>;

  beforeEach(() => {
    // Create mocks
    mockEventBus = {
      subscribe: jest.fn(),
      publish: jest.fn(),
    } as any;

    mockStore = {
      upsertLatest: jest.fn(),
      archiveLatest: jest.fn(),
      update: jest.fn(),
      addCompletedGoal: jest.fn(),
      addBlocker: jest.fn(),
      addDecision: jest.fn(),
      addStartedGoal: jest.fn(),
      addPausedGoal: jest.fn(),
      addResumedGoal: jest.fn(),
      findLatest: jest.fn(),
      findByOriginalId: jest.fn(),
    } as any;

    mockGoalReader = {
      findById: jest.fn(),
    } as any;

    mockDecisionReader = {
      findById: jest.fn(),
    } as any;

    // Create handler
    handler = new SessionSummaryProjectionHandler(
      mockEventBus,
      mockStore,
      mockGoalReader,
      mockDecisionReader
    );
  });

  describe("subscribe", () => {
    it("should subscribe to all relevant events", () => {
      handler.subscribe();

      expect(mockEventBus.subscribe).toHaveBeenCalledWith(
        "SessionStartedEvent",
        expect.any(Object)
      );
      expect(mockEventBus.subscribe).toHaveBeenCalledWith(
        "SessionEndedEvent",
        expect.any(Object)
      );
      expect(mockEventBus.subscribe).toHaveBeenCalledWith(
        "GoalCompletedEvent",
        expect.any(Object)
      );
      expect(mockEventBus.subscribe).toHaveBeenCalledWith(
        "GoalBlockedEvent",
        expect.any(Object)
      );
      expect(mockEventBus.subscribe).toHaveBeenCalledWith(
        "GoalStartedEvent",
        expect.any(Object)
      );
      expect(mockEventBus.subscribe).toHaveBeenCalledWith(
        "GoalPausedEvent",
        expect.any(Object)
      );
      expect(mockEventBus.subscribe).toHaveBeenCalledWith(
        "GoalResumedEvent",
        expect.any(Object)
      );
      expect(mockEventBus.subscribe).toHaveBeenCalledWith(
        "DecisionAddedEvent",
        expect.any(Object)
      );
    });
  });

  describe("handleSessionStarted", () => {
    it("should archive old LATEST and create new LATEST seed", async () => {
      const sessionStartedEvent = {
        type: "SessionStartedEvent",
        aggregateId: "session_123",
        version: 1,
        timestamp: "2025-01-01T10:00:00Z",
        payload: {
          focus: "Test session",
          contextSnapshot: null,
        },
      };

      // Get the handler that was passed to subscribe
      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "SessionStartedEvent"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      // Execute handler
      await eventHandler.handle(sessionStartedEvent);

      // Verify archival was attempted
      expect(mockStore.archiveLatest).toHaveBeenCalled();

      // Verify new LATEST seed was created
      expect(mockStore.upsertLatest).toHaveBeenCalledWith({
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
      });
    });
  });

  describe("handleSessionEnded", () => {
    it("should mark LATEST as ended", async () => {
      const sessionEndedEvent = {
        type: "SessionEndedEvent",
        aggregateId: "session_123",
        version: 1,
        timestamp: "2025-01-01T12:00:00Z",
        payload: {
          focus: "Test session",
          summary: "Completed work",
        },
      };

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "SessionEndedEvent"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(sessionEndedEvent);

      expect(mockStore.update).toHaveBeenCalledWith("LATEST", {
        status: "ended",
        updatedAt: "2025-01-01T12:00:00Z",
      });
    });
  });

  describe("handleGoalCompleted", () => {
    it("should append enriched goal to completedGoals when LATEST is active", async () => {
      const goalCompletedEvent = {
        type: "GoalCompletedEvent",
        aggregateId: "goal_456",
        version: 1,
        timestamp: "2025-01-01T11:00:00Z",
        payload: {
          status: "completed",
        },
      };

      const mockLatest: SessionSummaryProjection = {
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
      };

      const mockGoal: GoalView = {
        goalId: "goal_456",
        objective: "Complete task 1",
        successCriteria: [],
        scopeIn: [],
        scopeOut: [],
        
        status: "completed",
        version: 1,
        createdAt: "2025-01-01T09:00:00Z",
        updatedAt: "2025-01-01T11:00:00Z",
        progress: [],
      };

      mockStore.findLatest.mockResolvedValue(mockLatest);
      mockGoalReader.findById.mockResolvedValue(mockGoal);

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "GoalCompletedEvent"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(goalCompletedEvent);

      expect(mockStore.addCompletedGoal).toHaveBeenCalledWith({
        goalId: "goal_456",
        objective: "Complete task 1",
        status: "completed",
        createdAt: "2025-01-01T09:00:00Z",
      });
    });

    it("should skip when no LATEST exists", async () => {
      const goalCompletedEvent = {
        type: "GoalCompletedEvent",
        aggregateId: "goal_456",
        version: 1,
        timestamp: "2025-01-01T11:00:00Z",
        payload: {
          status: "completed",
        },
      };

      mockStore.findLatest.mockResolvedValue(null);

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "GoalCompletedEvent"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(goalCompletedEvent);

      expect(mockStore.addCompletedGoal).not.toHaveBeenCalled();
    });

    it("should skip when LATEST is not active", async () => {
      const goalCompletedEvent = {
        type: "GoalCompletedEvent",
        aggregateId: "goal_456",
        version: 1,
        timestamp: "2025-01-01T11:00:00Z",
        payload: {
          status: "completed",
        },
      };

      const mockLatest: SessionSummaryProjection = {
        sessionId: "LATEST",
        originalSessionId: "session_123",
        focus: "Test session",
        status: "ended",
        contextSnapshot: null,
        completedGoals: [],
        blockersEncountered: [],
        decisions: [],
        goalsStarted: [],
        goalsPaused: [],
        goalsResumed: [],
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T12:00:00Z",
      };

      mockStore.findLatest.mockResolvedValue(mockLatest);

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "GoalCompletedEvent"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(goalCompletedEvent);

      expect(mockStore.addCompletedGoal).not.toHaveBeenCalled();
    });

    it("should skip when goal not found in projection store", async () => {
      const goalCompletedEvent = {
        type: "GoalCompletedEvent",
        aggregateId: "goal_456",
        version: 1,
        timestamp: "2025-01-01T11:00:00Z",
        payload: {
          status: "completed",
        },
      };

      const mockLatest: SessionSummaryProjection = {
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
      };

      mockStore.findLatest.mockResolvedValue(mockLatest);
      mockGoalReader.findById.mockResolvedValue(null);

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "GoalCompletedEvent"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(goalCompletedEvent);

      expect(mockStore.addCompletedGoal).not.toHaveBeenCalled();
    });
  });

  describe("handleGoalBlocked", () => {
    it("should append enriched blocker when LATEST is active", async () => {
      const goalBlockedEvent = {
        type: "GoalBlockedEvent",
        aggregateId: "goal_789",
        version: 1,
        timestamp: "2025-01-01T11:30:00Z",
        payload: {
          status: "blocked",
          note: "API is down",
        },
      };

      const mockLatest: SessionSummaryProjection = {
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
      };

      const mockGoal: GoalView = {
        goalId: "goal_789",
        objective: "Deploy to production",
        successCriteria: [],
        scopeIn: [],
        scopeOut: [],
        
        status: "blocked",
        note: "API is down",
        version: 1,
        createdAt: "2025-01-01T09:00:00Z",
        updatedAt: "2025-01-01T11:30:00Z",
        progress: [],
      };

      mockStore.findLatest.mockResolvedValue(mockLatest);
      mockGoalReader.findById.mockResolvedValue(mockGoal);

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "GoalBlockedEvent"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(goalBlockedEvent);

      expect(mockStore.addBlocker).toHaveBeenCalledWith({
        goalId: "goal_789",
        reason: "API is down",
      });
    });
  });

  describe("handleDecisionAdded", () => {
    it("should append enriched decision when LATEST is active", async () => {
      const decisionAddedEvent = {
        type: "DecisionAddedEvent",
        aggregateId: "dec_001",
        version: 1,
        timestamp: "2025-01-01T11:45:00Z",
        payload: {
          title: "Use TypeScript",
          context: "Language choice",
          rationale: "Type safety and better tooling",
          alternatives: ["JavaScript", "Flow"],
          consequences: "Learning curve for team",
          status: "active",
        },
      };

      const mockLatest: SessionSummaryProjection = {
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
      };

      const mockDecision: DecisionView = {
        decisionId: "dec_001",
        title: "Use TypeScript",
        context: "Language choice",
        rationale: "Type safety and better tooling",
        alternatives: ["JavaScript", "Flow"],
        consequences: "Learning curve for team",
        status: "active",
        supersededBy: null,
        reversalReason: null,
        reversedAt: null,
        version: 1,
        createdAt: "2025-01-01T11:45:00Z",
        updatedAt: "2025-01-01T11:45:00Z",
      };

      mockStore.findLatest.mockResolvedValue(mockLatest);
      mockDecisionReader.findById.mockResolvedValue(mockDecision);

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "DecisionAddedEvent"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(decisionAddedEvent);

      expect(mockStore.addDecision).toHaveBeenCalledWith({
        decisionId: "dec_001",
        title: "Use TypeScript",
        rationale: "Type safety and better tooling",
      });
    });
  });

  describe("handleGoalStarted", () => {
    it("should append enriched goal to goalsStarted when LATEST is active", async () => {
      const goalStartedEvent = {
        type: "GoalStartedEvent",
        aggregateId: "goal_123",
        version: 1,
        timestamp: "2025-01-01T10:30:00Z",
        payload: {
          status: "doing",
        },
      };

      const mockLatest: SessionSummaryProjection = {
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
      };

      const mockGoal: GoalView = {
        goalId: "goal_123",
        objective: "Implement feature X",
        successCriteria: [],
        scopeIn: [],
        scopeOut: [],
        
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T09:00:00Z",
        updatedAt: "2025-01-01T10:30:00Z",
        progress: [],
      };

      mockStore.findLatest.mockResolvedValue(mockLatest);
      mockGoalReader.findById.mockResolvedValue(mockGoal);

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "GoalStartedEvent"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(goalStartedEvent);

      expect(mockStore.addStartedGoal).toHaveBeenCalledWith({
        goalId: "goal_123",
        objective: "Implement feature X",
        startedAt: "2025-01-01T10:30:00Z",
      });
    });

    it("should skip when no LATEST exists", async () => {
      const goalStartedEvent = {
        type: "GoalStartedEvent",
        aggregateId: "goal_123",
        version: 1,
        timestamp: "2025-01-01T10:30:00Z",
        payload: {
          status: "doing",
        },
      };

      mockStore.findLatest.mockResolvedValue(null);

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "GoalStartedEvent"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(goalStartedEvent);

      expect(mockStore.addStartedGoal).not.toHaveBeenCalled();
    });

    it("should skip when LATEST is not active", async () => {
      const goalStartedEvent = {
        type: "GoalStartedEvent",
        aggregateId: "goal_123",
        version: 1,
        timestamp: "2025-01-01T10:30:00Z",
        payload: {
          status: "doing",
        },
      };

      const mockLatest: SessionSummaryProjection = {
        sessionId: "LATEST",
        originalSessionId: "session_123",
        focus: "Test session",
        status: "ended",
        contextSnapshot: null,
        completedGoals: [],
        blockersEncountered: [],
        decisions: [],
        goalsStarted: [],
        goalsPaused: [],
        goalsResumed: [],
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T12:00:00Z",
      };

      mockStore.findLatest.mockResolvedValue(mockLatest);

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "GoalStartedEvent"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(goalStartedEvent);

      expect(mockStore.addStartedGoal).not.toHaveBeenCalled();
    });

    it("should skip when goal not found in projection store", async () => {
      const goalStartedEvent = {
        type: "GoalStartedEvent",
        aggregateId: "goal_123",
        version: 1,
        timestamp: "2025-01-01T10:30:00Z",
        payload: {
          status: "doing",
        },
      };

      const mockLatest: SessionSummaryProjection = {
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
      };

      mockStore.findLatest.mockResolvedValue(mockLatest);
      mockGoalReader.findById.mockResolvedValue(null);

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "GoalStartedEvent"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(goalStartedEvent);

      expect(mockStore.addStartedGoal).not.toHaveBeenCalled();
    });
  });

  describe("handleGoalPaused", () => {
    it("should append enriched goal to goalsPaused when LATEST is active", async () => {
      const goalPausedEvent = {
        type: "GoalPausedEvent",
        aggregateId: "goal_456",
        version: 1,
        timestamp: "2025-01-01T11:15:00Z",
        payload: {
          status: "paused",
          reason: "ContextCompressed",
          note: "Need more information",
        },
      };

      const mockLatest: SessionSummaryProjection = {
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
      };

      const mockGoal: GoalView = {
        goalId: "goal_456",
        objective: "Research API options",
        successCriteria: [],
        scopeIn: [],
        scopeOut: [],
        
        status: "paused",
        version: 1,
        createdAt: "2025-01-01T09:00:00Z",
        updatedAt: "2025-01-01T11:15:00Z",
        progress: [],
      };

      mockStore.findLatest.mockResolvedValue(mockLatest);
      mockGoalReader.findById.mockResolvedValue(mockGoal);

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "GoalPausedEvent"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(goalPausedEvent);

      expect(mockStore.addPausedGoal).toHaveBeenCalledWith({
        goalId: "goal_456",
        objective: "Research API options",
        reason: "ContextCompressed",
        note: "Need more information",
        pausedAt: "2025-01-01T11:15:00Z",
      });
    });

    it("should skip when no LATEST exists", async () => {
      const goalPausedEvent = {
        type: "GoalPausedEvent",
        aggregateId: "goal_456",
        version: 1,
        timestamp: "2025-01-01T11:15:00Z",
        payload: {
          status: "paused",
          reason: "ContextCompressed",
        },
      };

      mockStore.findLatest.mockResolvedValue(null);

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "GoalPausedEvent"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(goalPausedEvent);

      expect(mockStore.addPausedGoal).not.toHaveBeenCalled();
    });
  });

  describe("handleGoalResumed", () => {
    it("should append enriched goal to goalsResumed when LATEST is active", async () => {
      const goalResumedEvent = {
        type: "GoalResumedEvent",
        aggregateId: "goal_789",
        version: 1,
        timestamp: "2025-01-01T12:00:00Z",
        payload: {
          status: "doing",
          note: "Got the info needed",
        },
      };

      const mockLatest: SessionSummaryProjection = {
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
      };

      const mockGoal: GoalView = {
        goalId: "goal_789",
        objective: "Complete documentation",
        successCriteria: [],
        scopeIn: [],
        scopeOut: [],
        
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T09:00:00Z",
        updatedAt: "2025-01-01T12:00:00Z",
        progress: [],
      };

      mockStore.findLatest.mockResolvedValue(mockLatest);
      mockGoalReader.findById.mockResolvedValue(mockGoal);

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "GoalResumedEvent"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(goalResumedEvent);

      expect(mockStore.addResumedGoal).toHaveBeenCalledWith({
        goalId: "goal_789",
        objective: "Complete documentation",
        note: "Got the info needed",
        resumedAt: "2025-01-01T12:00:00Z",
      });
    });

    it("should skip when no LATEST exists", async () => {
      const goalResumedEvent = {
        type: "GoalResumedEvent",
        aggregateId: "goal_789",
        version: 1,
        timestamp: "2025-01-01T12:00:00Z",
        payload: {
          status: "doing",
        },
      };

      mockStore.findLatest.mockResolvedValue(null);

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "GoalResumedEvent"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(goalResumedEvent);

      expect(mockStore.addResumedGoal).not.toHaveBeenCalled();
    });
  });
});
