/**
 * Tests for CompleteGoalCommandHandler (command handler)
 */

import { CompleteGoalCommandHandler } from "../../../../../src/application/context/goals/complete/CompleteGoalCommandHandler";
import { CompleteGoalCommand } from "../../../../../src/application/context/goals/complete/CompleteGoalCommand";
import { IGoalCompletedEventWriter } from "../../../../../src/application/context/goals/complete/IGoalCompletedEventWriter";
import { IGoalCompletedEventReader } from "../../../../../src/application/context/goals/complete/IGoalCompletedEventReader";
import { IGoalCompleteReader } from "../../../../../src/application/context/goals/complete/IGoalCompleteReader";
import { IEventBus } from "../../../../../src/application/messaging/IEventBus";
import { GoalEventType, GoalStatus } from "../../../../../src/domain/goals/Constants";
import { GoalView } from "../../../../../src/application/context/goals/GoalView";
import { GoalClaimPolicy } from "../../../../../src/application/context/goals/claims/GoalClaimPolicy";
import { IGoalClaimStore } from "../../../../../src/application/context/goals/claims/IGoalClaimStore";
import { IClock } from "../../../../../src/application/time-and-date/IClock";
import { IWorkerIdentityReader } from "../../../../../src/application/host/workers/IWorkerIdentityReader";
import { createWorkerId } from "../../../../../src/application/host/workers/WorkerId";
import { GoalContextQueryHandler } from "../../../../../src/application/context/goals/get/GoalContextQueryHandler";

describe("CompleteGoalCommandHandler", () => {
  let eventWriter: IGoalCompletedEventWriter;
  let eventReader: IGoalCompletedEventReader;
  let goalReader: IGoalCompleteReader;
  let eventBus: IEventBus;
  let claimStore: IGoalClaimStore;
  let clock: IClock;
  let claimPolicy: GoalClaimPolicy;
  let workerIdentityReader: IWorkerIdentityReader;
  let goalContextQueryHandler: GoalContextQueryHandler;
  let handler: CompleteGoalCommandHandler;

  const testWorkerId = createWorkerId("test-worker-id");

  beforeEach(() => {
    // Mock event writer
    eventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 3 }),
    };

    // Mock event reader
    eventReader = {
      readStream: jest.fn(),
    };

    // Mock goal reader
    goalReader = {
      findById: jest.fn(),
    };

    // Mock event bus
    eventBus = {
      subscribe: jest.fn(),
      publish: jest.fn().mockResolvedValue(undefined),
    };

    // Mock claim store
    claimStore = {
      getClaim: jest.fn().mockReturnValue(null),
      setClaim: jest.fn(),
      releaseClaim: jest.fn(),
    };

    // Mock clock
    clock = {
      nowIso: jest.fn().mockReturnValue("2025-01-15T10:00:00.000Z"),
    };

    // Create claim policy with mocked dependencies
    claimPolicy = new GoalClaimPolicy(claimStore, clock);

    // Mock worker identity reader
    workerIdentityReader = {
      workerId: testWorkerId,
    };

    // Mock goal context query handler
    goalContextQueryHandler = {
      execute: jest.fn().mockResolvedValue({
        goal: {
          goalId: "goal_123",
          objective: "Mock objective",
          successCriteria: [],
          scopeIn: [],
          scopeOut: [],
          status: "doing",
          version: 1,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
          progress: [],
        },
        context: {
          components: [],
          dependencies: [],
          decisions: [],
          invariants: [],
          guidelines: [],
          architecture: null,
        },
      }),
    } as any;

    handler = new CompleteGoalCommandHandler(
      eventWriter,
      eventReader,
      goalReader,
      eventBus,
      claimPolicy,
      workerIdentityReader,
      goalContextQueryHandler
    );
  });

  it("should complete goal from qualified status and publish GoalCompletedEvent event", async () => {
    // Arrange
    const command: CompleteGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.QUALIFIED,
      version: 4,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock event history (GoalAddedEvent, GoalStartedEvent, GoalSubmittedForReviewEvent, GoalQualifiedEvent)
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Implement authentication",
          successCriteria: ["Users can log in"],
          scopeIn: [],
          scopeOut: [],
          
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: "GoalSubmittedForReviewEvent",
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.INREVIEW,
          submittedAt: "2025-01-01T02:00:00Z",
        },
      },
      {
        type: "GoalQualifiedEvent",
        aggregateId: "goal_123",
        version: 4,
        timestamp: "2025-01-01T03:00:00Z",
        payload: {
          status: GoalStatus.QUALIFIED,
          qualifiedAt: "2025-01-01T03:00:00Z",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.goal.goalId).toBe("goal_123");

    // Verify event was appended to event store
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(GoalEventType.COMPLETED);
    expect(appendedEvent.aggregateId).toBe("goal_123");
    expect(appendedEvent.version).toBe(5);
    expect(appendedEvent.payload.status).toBe(GoalStatus.COMPLETED);

    // Verify event was published to event bus
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(publishedEvent.type).toBe(GoalEventType.COMPLETED);
    expect(publishedEvent.aggregateId).toBe("goal_123");
  });

  it("should throw error when completing from blocked status", async () => {
    // Arrange
    const command: CompleteGoalCommand = {
      goalId: "goal_456",
    };

    // Mock projection exists (blocked status)
    const mockView: GoalView = {
      goalId: "goal_456",
      objective: "Fix critical bug",
      successCriteria: ["Bug is resolved"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.BLOCKED,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      note: "Waiting for dependencies",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock event history (GoalAddedEvent, GoalStartedEvent, GoalBlockedEvent)
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_456",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Fix critical bug",
          successCriteria: ["Bug is resolved"],
          scopeIn: [],
          scopeOut: [],
          
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_456",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: GoalEventType.BLOCKED,
        aggregateId: "goal_456",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.BLOCKED,
          note: "Waiting for dependencies",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Cannot complete goal. Goal must be qualified first."
    );
  });

  it("should throw error if goal not found", async () => {
    // Arrange
    const command: CompleteGoalCommand = {
      goalId: "nonexistent",
    };

    // Mock projection not found
    (goalReader.findById as jest.Mock).mockResolvedValue(null);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Goal not found: nonexistent"
    );
  });

  it("should propagate validation error if goal not qualified (to-do status)", async () => {
    // Arrange
    const command: CompleteGoalCommand = {
      goalId: "goal_789",
    };

    // Mock projection exists (to-do status)
    const mockView: GoalView = {
      goalId: "goal_789",
      objective: "Not started goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.TODO,
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock event history (only GoalAddedEvent)
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_789",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Not started goal",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          
          status: GoalStatus.TODO,
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Cannot complete goal. Goal must be qualified first."
    );
  });

  it("should propagate validation error if goal already completed", async () => {
    // Arrange
    const command: CompleteGoalCommand = {
      goalId: "goal_999",
    };

    // Mock projection exists (completed status)
    const mockView: GoalView = {
      goalId: "goal_999",
      objective: "Already completed",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.COMPLETED,
      version: 5,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock event history (GoalAddedEvent, GoalStartedEvent, GoalSubmittedForReviewEvent, GoalQualifiedEvent, GoalCompletedEvent)
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_999",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Already completed",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_999",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: "GoalSubmittedForReviewEvent",
        aggregateId: "goal_999",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.INREVIEW,
          submittedAt: "2025-01-01T02:00:00Z",
        },
      },
      {
        type: "GoalQualifiedEvent",
        aggregateId: "goal_999",
        version: 4,
        timestamp: "2025-01-01T03:00:00Z",
        payload: {
          status: GoalStatus.QUALIFIED,
          qualifiedAt: "2025-01-01T03:00:00Z",
        },
      },
      {
        type: GoalEventType.COMPLETED,
        aggregateId: "goal_999",
        version: 5,
        timestamp: "2025-01-01T04:00:00Z",
        payload: {
          status: GoalStatus.COMPLETED,
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Goal is already completed"
    );
  });

  it("should throw error if goal is claimed by another worker", async () => {
    // Arrange
    const command: CompleteGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.DOING,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock another worker's active claim
    const otherWorkerId = createWorkerId("other-worker-id");
    (claimStore.getClaim as jest.Mock).mockReturnValue({
      goalId: "goal_123",
      claimedBy: otherWorkerId,
      claimedAt: "2025-01-15T09:00:00.000Z",
      claimExpiresAt: "2025-01-15T11:00:00.000Z", // Expires after current time (10:00)
    });

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Goal is claimed by another worker. Claim expires at 2025-01-15T11:00:00.000Z."
    );

    // Verify domain logic was never called
    expect(eventWriter.append).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it("should allow completion if claim has expired", async () => {
    // Arrange
    const command: CompleteGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists (qualified status)
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.QUALIFIED,
      version: 4,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock expired claim from another worker
    const otherWorkerId = createWorkerId("other-worker-id");
    (claimStore.getClaim as jest.Mock).mockReturnValue({
      goalId: "goal_123",
      claimedBy: otherWorkerId,
      claimedAt: "2025-01-15T08:00:00.000Z",
      claimExpiresAt: "2025-01-15T09:00:00.000Z", // Expired before current time (10:00)
    });

    // Mock event history (includes qualification)
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Implement authentication",
          successCriteria: ["Users can log in"],
          scopeIn: [],
          scopeOut: [],
          
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: "GoalSubmittedForReviewEvent",
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.INREVIEW,
          submittedAt: "2025-01-01T02:00:00Z",
        },
      },
      {
        type: "GoalQualifiedEvent",
        aggregateId: "goal_123",
        version: 4,
        timestamp: "2025-01-01T03:00:00Z",
        payload: {
          status: GoalStatus.QUALIFIED,
          qualifiedAt: "2025-01-01T03:00:00Z",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.goal.goalId).toBe("goal_123");
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
  });

  it("should allow completion if current worker owns the claim", async () => {
    // Arrange
    const command: CompleteGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists (qualified status)
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.QUALIFIED,
      version: 4,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock claim owned by current worker
    (claimStore.getClaim as jest.Mock).mockReturnValue({
      goalId: "goal_123",
      claimedBy: testWorkerId,
      claimedAt: "2025-01-15T09:00:00.000Z",
      claimExpiresAt: "2025-01-15T11:00:00.000Z",
    });

    // Mock event history (includes qualification)
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Implement authentication",
          successCriteria: ["Users can log in"],
          scopeIn: [],
          scopeOut: [],
          
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: "GoalSubmittedForReviewEvent",
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.INREVIEW,
          submittedAt: "2025-01-01T02:00:00Z",
        },
      },
      {
        type: "GoalQualifiedEvent",
        aggregateId: "goal_123",
        version: 4,
        timestamp: "2025-01-01T03:00:00Z",
        payload: {
          status: GoalStatus.QUALIFIED,
          qualifiedAt: "2025-01-01T03:00:00Z",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.goal.goalId).toBe("goal_123");
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    expect(claimStore.releaseClaim).toHaveBeenCalledWith("goal_123");
  });

  it("should propagate errors if event store fails", async () => {
    // Arrange
    const command: CompleteGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists (qualified status)
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Test goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.QUALIFIED,
      version: 4,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock event history (includes qualification)
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Test goal",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: "GoalSubmittedForReviewEvent",
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.INREVIEW,
          submittedAt: "2025-01-01T02:00:00Z",
        },
      },
      {
        type: "GoalQualifiedEvent",
        aggregateId: "goal_123",
        version: 4,
        timestamp: "2025-01-01T03:00:00Z",
        payload: {
          status: GoalStatus.QUALIFIED,
          qualifiedAt: "2025-01-01T03:00:00Z",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Mock event store failure
    (eventWriter.append as jest.Mock).mockRejectedValue(
      new Error("Event store failure")
    );

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow("Event store failure");
  });
});
