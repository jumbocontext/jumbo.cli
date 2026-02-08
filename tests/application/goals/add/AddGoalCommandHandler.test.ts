/**
 * Tests for AddGoalCommandHandler (command handler)
 *
 * Note: Handler generates goalId as part of orchestration (Clean Architecture).
 * Commands express user intent only - no generated IDs.
 */

import { AddGoalCommandHandler } from "../../../../src/application/goals/add/AddGoalCommandHandler";
import { AddGoalCommand } from "../../../../src/application/goals/add/AddGoalCommand";
import { IGoalAddedEventWriter } from "../../../../src/application/goals/add/IGoalAddedEventWriter";
import { IEventBus } from "../../../../src/application/messaging/IEventBus";
import { GoalEventType, GoalStatus } from "../../../../src/domain/goals/Constants";

describe("AddGoalCommandHandler", () => {
  let eventWriter: IGoalAddedEventWriter;
  let eventBus: IEventBus;
  let handler: AddGoalCommandHandler;

  beforeEach(() => {
    // Mock event writer
    eventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 1 }),
    };

    // Mock event bus
    eventBus = {
      subscribe: jest.fn(),
      publish: jest.fn().mockResolvedValue(undefined),
    };

    handler = new AddGoalCommandHandler(eventWriter, eventBus);
  });

  it("should generate goalId and publish GoalAddedEvent event", async () => {
    // Arrange - command contains only user-provided data, no goalId
    const command: AddGoalCommand = {
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: ["AuthController"],
      scopeOut: ["AdminPanel"],
      boundaries: ["No breaking changes"],
    };

    // Act
    const result = await handler.execute(command);

    // Assert - handler generates goalId with correct format
    expect(result.goalId).toMatch(/^goal_[0-9a-f-]+$/);

    // Verify event was appended to event store
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(GoalEventType.ADDED);
    expect(appendedEvent.aggregateId).toBe(result.goalId);
    expect(appendedEvent.version).toBe(1);
    expect(appendedEvent.payload.objective).toBe("Implement authentication");
    expect(appendedEvent.payload.successCriteria).toEqual(["Users can log in"]);
    expect(appendedEvent.payload.status).toBe(GoalStatus.TODO);

    // Verify event was published to event bus
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(publishedEvent.type).toBe(GoalEventType.ADDED);
    expect(publishedEvent.aggregateId).toBe(result.goalId);
  });

  it("should handle minimal command with only required fields", async () => {
    // Arrange
    const command: AddGoalCommand = {
      objective: "Fix bug #123",
      successCriteria: ["Bug is resolved"],
    };

    // Act
    const result = await handler.execute(command);

    // Assert - goalId is generated
    expect(result.goalId).toMatch(/^goal_[0-9a-f-]+$/);

    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.payload.scopeIn).toEqual([]);
    expect(appendedEvent.payload.scopeOut).toEqual([]);
    expect(appendedEvent.payload.boundaries).toEqual([]);
  });

  it("should propagate validation errors from domain", async () => {
    // Arrange: Empty objective should fail domain validation
    const command: AddGoalCommand = {
      objective: "",
      successCriteria: ["Criterion 1"],
    };

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Goal objective must be provided"
    );
  });

  it("should propagate errors if event store fails", async () => {
    // Arrange
    const command: AddGoalCommand = {
      objective: "Test goal",
      successCriteria: ["Criterion 1"],
    };

    (eventWriter.append as jest.Mock).mockRejectedValue(
      new Error("Event store failure")
    );

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow("Event store failure");
  });

  it("should pass embedded context fields to domain", async () => {
    // Arrange
    const command: AddGoalCommand = {
      objective: "Implement feature with context",
      successCriteria: ["Feature complete"],
      relevantInvariants: [{ title: "DRY", description: "Don't repeat yourself" }],
      relevantGuidelines: [{ title: "TypeScript", description: "Use strict mode" }],
      relevantDependencies: [{ consumer: "ModuleA", provider: "ModuleB" }],
      relevantComponents: [{ name: "FeatureService", responsibility: "Handle feature logic" }],
      architecture: { description: "Clean Architecture", organization: "By layer" },
      filesToBeCreated: ["src/feature/service.ts"],
      filesToBeChanged: ["src/index.ts"],
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.goalId).toMatch(/^goal_[0-9a-f-]+$/);

    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.payload.relevantInvariants).toEqual(command.relevantInvariants);
    expect(appendedEvent.payload.relevantGuidelines).toEqual(command.relevantGuidelines);
    expect(appendedEvent.payload.relevantDependencies).toEqual(command.relevantDependencies);
    expect(appendedEvent.payload.relevantComponents).toEqual(command.relevantComponents);
    expect(appendedEvent.payload.architecture).toEqual(command.architecture);
    expect(appendedEvent.payload.filesToBeCreated).toEqual(command.filesToBeCreated);
    expect(appendedEvent.payload.filesToBeChanged).toEqual(command.filesToBeChanged);
  });

  it("should not include embedded context when not provided", async () => {
    // Arrange
    const command: AddGoalCommand = {
      objective: "Simple goal",
      successCriteria: ["Done"],
    };

    // Act
    await handler.execute(command);

    // Assert
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.payload.relevantInvariants).toBeUndefined();
    expect(appendedEvent.payload.relevantGuidelines).toBeUndefined();
    expect(appendedEvent.payload.relevantDependencies).toBeUndefined();
    expect(appendedEvent.payload.relevantComponents).toBeUndefined();
    expect(appendedEvent.payload.architecture).toBeUndefined();
    expect(appendedEvent.payload.filesToBeCreated).toBeUndefined();
    expect(appendedEvent.payload.filesToBeChanged).toBeUndefined();
  });
});
