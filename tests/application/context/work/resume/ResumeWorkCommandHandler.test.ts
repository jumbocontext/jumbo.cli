/**
 * Tests for ResumeWorkCommandHandler (work-level command handler)
 */

import { ResumeWorkCommandHandler } from "../../../../../src/application/context/work/resume/ResumeWorkCommandHandler";
import { IWorkerIdentityReader } from "../../../../../src/application/host/workers/IWorkerIdentityReader";
import { IGoalStatusReader } from "../../../../../src/application/context/goals/IGoalStatusReader";
import { IGoalResumedEventWriter } from "../../../../../src/application/context/goals/resume/IGoalResumedEventWriter";
import { IGoalResumedEventReader } from "../../../../../src/application/context/goals/resume/IGoalResumedEventReader";
import { IGoalReader } from "../../../../../src/application/context/goals/resume/IGoalReader";
import { IEventBus } from "../../../../../src/application/messaging/IEventBus";
import { GoalClaimPolicy } from "../../../../../src/application/context/goals/claims/GoalClaimPolicy";
import { ISettingsReader } from "../../../../../src/application/settings/ISettingsReader";
import { ISessionSummaryReader } from "../../../../../src/application/context/sessions/get-context/ISessionSummaryReader";
import { GoalEventType, GoalStatus } from "../../../../../src/domain/goals/Constants";
import { GoalPausedReasons } from "../../../../../src/domain/goals/GoalPausedReasons";
import { GoalView } from "../../../../../src/application/context/goals/GoalView";
import { createWorkerId } from "../../../../../src/application/host/workers/WorkerId";
import { GoalContextQueryHandler } from "../../../../../src/application/context/GoalContextQueryHandler";
import { IGoalContextAssembler } from "../../../../../src/application/context/IGoalContextAssembler";
import { ILogger } from "../../../../../src/application/logging/ILogger";

describe("ResumeWorkCommandHandler", () => {
  let workerIdentityReader: IWorkerIdentityReader;
  let goalStatusReader: IGoalStatusReader;
  let goalResumedEventWriter: IGoalResumedEventWriter;
  let goalResumedEventReader: IGoalResumedEventReader;
  let goalReader: IGoalReader;
  let eventBus: IEventBus;
  let claimPolicy: GoalClaimPolicy;
  let settingsReader: ISettingsReader;
  let sessionSummaryReader: ISessionSummaryReader;
  let goalContextQueryHandler: GoalContextQueryHandler;
  let logger: ILogger;
  let handler: ResumeWorkCommandHandler;

  const workerId = createWorkerId("worker_123");

  function mockFindByStatus(pausedGoals: GoalView[]) {
    (goalStatusReader.findByStatus as jest.Mock).mockImplementation(
      (status: string) => {
        if (status === GoalStatus.PAUSED) return Promise.resolve(pausedGoals);
        if (status === GoalStatus.DOING) return Promise.resolve([]);
        if (status === GoalStatus.BLOCKED) return Promise.resolve([]);
        if (status === GoalStatus.TODO) return Promise.resolve([]);
        return Promise.resolve([]);
      }
    );
  }

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
    goalResumedEventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 4 }),
    };

    // Mock event reader
    goalResumedEventReader = {
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

    // Mock claim policy
    claimPolicy = {
      canClaim: jest.fn().mockReturnValue({ allowed: true }),
      prepareRefreshedClaim: jest.fn().mockReturnValue({
        goalId: "goal_123",
        claimedBy: workerId,
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      }),
      storeClaim: jest.fn(),
    } as unknown as GoalClaimPolicy;

    // Mock settings reader
    settingsReader = {
      read: jest.fn().mockResolvedValue({
        claims: { claimDurationMinutes: 60 },
      }),
    } as unknown as ISettingsReader;

    // Mock session summary reader
    sessionSummaryReader = {
      findLatest: jest.fn().mockResolvedValue(null),
    };

    // Mock logger
    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      flush: jest.fn(),
    } as unknown as ILogger;

    // Mock goal context assembler
    const goalContextAssembler = {
      assembleContextForGoal: jest.fn().mockResolvedValue({
        goal: { goalId: "goal_123", objective: "Test goal", status: GoalStatus.PAUSED },
        context: {
          components: [],
          dependencies: [],
          decisions: [],
          invariants: [],
          guidelines: [],
          architecture: null,
        },
      }),
    } as unknown as IGoalContextAssembler;

    // Create goal context query handler
    goalContextQueryHandler = new GoalContextQueryHandler(goalContextAssembler);

    handler = new ResumeWorkCommandHandler(
      workerIdentityReader,
      goalStatusReader,
      goalResumedEventWriter,
      goalResumedEventReader,
      goalReader,
      eventBus,
      claimPolicy,
      settingsReader,
      logger,
      sessionSummaryReader,
      goalContextQueryHandler
    );
  });

  it("should resume the paused goal claimed by current worker", async () => {
    // Arrange
    const pausedGoal: GoalView = {
      goalId: "goal_123",
      objective: "Implement feature",
      successCriteria: ["Feature works"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.PAUSED,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: workerId,
      progress: [],
    };

    mockFindByStatus([pausedGoal]);
    (goalReader.findById as jest.Mock).mockResolvedValue(pausedGoal);

    // Mock event history for ResumeGoalCommandHandler
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
      {
        type: GoalEventType.PAUSED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.PAUSED,
          reason: GoalPausedReasons.WorkPaused,
        },
      },
    ];
    (goalResumedEventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute({});

    // Assert
    expect(result.goalId).toBe("goal_123");
    expect(result.objective).toBe("Implement feature");
    expect(goalStatusReader.findByStatus).toHaveBeenCalledWith(GoalStatus.PAUSED);

    // Verify resume event was created
    const appendedEvent = (goalResumedEventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(GoalEventType.RESUMED);
    expect(appendedEvent.payload.status).toBe(GoalStatus.DOING);
  });

  it("should return enriched session context with work-resume scope", async () => {
    // Arrange
    const pausedGoal: GoalView = {
      goalId: "goal_123",
      objective: "Implement feature",
      successCriteria: ["Feature works"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.PAUSED,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: workerId,
      progress: [],
    };

    mockFindByStatus([pausedGoal]);
    (goalReader.findById as jest.Mock).mockResolvedValue(pausedGoal);

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
        payload: { status: GoalStatus.DOING },
      },
      {
        type: GoalEventType.PAUSED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: { status: GoalStatus.PAUSED, reason: GoalPausedReasons.WorkPaused },
      },
    ];
    (goalResumedEventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute({});

    // Assert
    expect(result.sessionContext).toBeDefined();
    expect(result.sessionContext.scope).toBe("work-resume");
    expect(result.sessionContext.instructions).toContain("resume-continuation-prompt");
  });

  it("should throw error when no paused goal found for worker", async () => {
    // Arrange - no goals in paused status
    mockFindByStatus([]);

    // Act & Assert
    await expect(handler.execute({})).rejects.toThrow(
      "No paused goal found for current worker"
    );
  });

  it("should throw error when paused goals exist but none claimed by current worker", async () => {
    // Arrange - goals exist but claimed by different worker
    const otherWorkerGoal: GoalView = {
      goalId: "goal_456",
      objective: "Other worker's goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.PAUSED,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: "other_worker_id",
      progress: [],
    };

    mockFindByStatus([otherWorkerGoal]);

    // Act & Assert
    await expect(handler.execute({})).rejects.toThrow(
      "No paused goal found for current worker"
    );
  });

  it("should select correct goal when multiple paused goals exist", async () => {
    // Arrange - multiple goals, only one claimed by current worker
    const otherWorkerGoal: GoalView = {
      goalId: "goal_other",
      objective: "Other worker's goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.PAUSED,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: "other_worker_id",
      progress: [],
    };

    const myGoal: GoalView = {
      goalId: "goal_mine",
      objective: "My paused goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.PAUSED,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: workerId,
      progress: [],
    };

    mockFindByStatus([otherWorkerGoal, myGoal]);
    (goalReader.findById as jest.Mock).mockResolvedValue(myGoal);

    // Mock event history
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_mine",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "My paused goal",
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
      {
        type: GoalEventType.PAUSED,
        aggregateId: "goal_mine",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.PAUSED,
          reason: GoalPausedReasons.WorkPaused,
        },
      },
    ];
    (goalResumedEventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute({});

    // Assert
    expect(result.goalId).toBe("goal_mine");
    expect(result.objective).toBe("My paused goal");
  });

  it("should propagate errors from ResumeGoalCommandHandler", async () => {
    // Arrange
    const pausedGoal: GoalView = {
      goalId: "goal_123",
      objective: "Test goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.PAUSED,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: workerId,
      progress: [],
    };

    mockFindByStatus([pausedGoal]);
    (goalReader.findById as jest.Mock).mockResolvedValue(pausedGoal);

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
      {
        type: GoalEventType.PAUSED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.PAUSED,
          reason: GoalPausedReasons.WorkPaused,
        },
      },
    ];
    (goalResumedEventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Mock event store failure
    (goalResumedEventWriter.append as jest.Mock).mockRejectedValue(
      new Error("Event store failure")
    );

    // Act & Assert
    await expect(handler.execute({})).rejects.toThrow("Event store failure");
  });

  it("should refresh claim when resuming goal", async () => {
    // Arrange
    const pausedGoal: GoalView = {
      goalId: "goal_123",
      objective: "Test goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.PAUSED,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: workerId,
      progress: [],
    };

    mockFindByStatus([pausedGoal]);
    (goalReader.findById as jest.Mock).mockResolvedValue(pausedGoal);

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
      {
        type: GoalEventType.PAUSED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.PAUSED,
          reason: GoalPausedReasons.WorkPaused,
        },
      },
    ];
    (goalResumedEventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    await handler.execute({});

    // Assert - verify claim was prepared and stored
    expect(claimPolicy.prepareRefreshedClaim).toHaveBeenCalled();
    expect(claimPolicy.storeClaim).toHaveBeenCalled();

    // Verify claim data embedded in event
    const appendedEvent = (goalResumedEventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.payload.claimedBy).toBe(workerId);
    expect(appendedEvent.payload.claimedAt).toBeDefined();
    expect(appendedEvent.payload.claimExpiresAt).toBeDefined();
  });
});
