/**
 * Tests for PauseWorkCommandHandler (work-level command handler)
 */

import { PauseWorkCommandHandler } from "../../../../../src/application/context/work/pause/PauseWorkCommandHandler";
import { IWorkerIdentityReader } from "../../../../../src/application/host/workers/IWorkerIdentityReader";
import { IGoalStatusReader } from "../../../../../src/application/context/goals/IGoalStatusReader";
import { IGoalPausedEventWriter } from "../../../../../src/application/context/goals/pause/IGoalPausedEventWriter";
import { IGoalPausedEventReader } from "../../../../../src/application/context/goals/pause/IGoalPausedEventReader";
import { IGoalReader } from "../../../../../src/application/context/goals/pause/IGoalReader";
import { IEventBus } from "../../../../../src/application/messaging/IEventBus";
import { GoalEventType, GoalStatus } from "../../../../../src/domain/goals/Constants";
import { GoalPausedReasons } from "../../../../../src/domain/goals/GoalPausedReasons";
import { GoalView } from "../../../../../src/application/context/goals/GoalView";
import { createWorkerId } from "../../../../../src/application/host/workers/WorkerId";
import { ILogger } from "../../../../../src/application/logging/ILogger";

describe("PauseWorkCommandHandler", () => {
  let workerIdentityReader: IWorkerIdentityReader;
  let goalStatusReader: IGoalStatusReader;
  let goalPausedEventWriter: IGoalPausedEventWriter;
  let goalPausedEventReader: IGoalPausedEventReader;
  let goalReader: IGoalReader;
  let eventBus: IEventBus;
  let logger: ILogger;
  let handler: PauseWorkCommandHandler;

  const workerId = createWorkerId("worker_123");

  beforeEach(() => {
    // Mock worker identity reader
    workerIdentityReader = {
      workerId,
    };

    // Mock goal status reader
    goalStatusReader = {
      findByStatus: jest.fn(),
      findAll: jest.fn(),
    };

    // Mock event writer
    goalPausedEventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 3 }),
    };

    // Mock event reader
    goalPausedEventReader = {
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

    // Mock logger
    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      flush: jest.fn(),
    } as unknown as ILogger;

    handler = new PauseWorkCommandHandler(
      workerIdentityReader,
      goalStatusReader,
      goalPausedEventWriter,
      goalPausedEventReader,
      goalReader,
      eventBus,
      logger
    );
  });

  it("should pause the active goal claimed by current worker", async () => {
    // Arrange
    const activeGoal: GoalView = {
      goalId: "goal_123",
      objective: "Implement feature",
      successCriteria: ["Feature works"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.DOING,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: workerId,
      progress: [],
    };

    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([activeGoal]);
    (goalReader.findById as jest.Mock).mockResolvedValue(activeGoal);

    // Mock event history for PauseGoalCommandHandler
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Implement feature",
          successCriteria: ["Feature works"],
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
    ];
    (goalPausedEventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute({});

    // Assert
    expect(result.goalId).toBe("goal_123");
    expect(result.objective).toBe("Implement feature");
    expect(goalStatusReader.findByStatus).toHaveBeenCalledWith(GoalStatus.DOING);

    // Verify pause event was created with WorkPaused reason
    const appendedEvent = (goalPausedEventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(GoalEventType.PAUSED);
    expect(appendedEvent.payload.reason).toBe(GoalPausedReasons.WorkPaused);
  });

  it("should throw error when no active goal found for worker", async () => {
    // Arrange - no goals in doing status
    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([]);

    // Act & Assert
    await expect(handler.execute({})).rejects.toThrow(
      "No active goal found for current worker"
    );
  });

  it("should throw error when doing goals exist but none claimed by current worker", async () => {
    // Arrange - goals exist but claimed by different worker
    const otherWorkerGoal: GoalView = {
      goalId: "goal_456",
      objective: "Other worker's goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.DOING,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: "other_worker_id",
      progress: [],
    };

    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([otherWorkerGoal]);

    // Act & Assert
    await expect(handler.execute({})).rejects.toThrow(
      "No active goal found for current worker"
    );
  });

  it("should select correct goal when multiple doing goals exist", async () => {
    // Arrange - multiple goals, only one claimed by current worker
    const otherWorkerGoal: GoalView = {
      goalId: "goal_other",
      objective: "Other worker's goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.DOING,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: "other_worker_id",
      progress: [],
    };

    const myGoal: GoalView = {
      goalId: "goal_mine",
      objective: "My active goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.DOING,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: workerId,
      progress: [],
    };

    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([otherWorkerGoal, myGoal]);
    (goalReader.findById as jest.Mock).mockResolvedValue(myGoal);

    // Mock event history
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_mine",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "My active goal",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_mine",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
    ];
    (goalPausedEventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute({});

    // Assert
    expect(result.goalId).toBe("goal_mine");
    expect(result.objective).toBe("My active goal");
  });

  it("should propagate errors from PauseGoalCommandHandler", async () => {
    // Arrange
    const activeGoal: GoalView = {
      goalId: "goal_123",
      objective: "Test goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.DOING,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: workerId,
      progress: [],
    };

    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([activeGoal]);
    (goalReader.findById as jest.Mock).mockResolvedValue(activeGoal);

    // Mock event history
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
    ];
    (goalPausedEventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Mock event store failure
    (goalPausedEventWriter.append as jest.Mock).mockRejectedValue(
      new Error("Event store failure")
    );

    // Act & Assert
    await expect(handler.execute({})).rejects.toThrow("Event store failure");
  });
});
