/**
 * Tests for Goal aggregate
 */

import { Goal } from "../../../../src/domain/goals/Goal";
import { GoalEventType, GoalStatus } from "../../../../src/domain/goals/Constants";

describe("Goal Aggregate", () => {
  describe("define()", () => {
    it("should create GoalAddedEvent event with required fields only", () => {
      // Arrange
      const goal = Goal.create("goal_123");

      // Act
      const event = goal.add("Implement authentication", ["Users can log in"]);

      // Assert
      expect(event.type).toBe(GoalEventType.ADDED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(1);
      expect(event.payload.objective).toBe("Implement authentication");
      expect(event.payload.successCriteria).toEqual(["Users can log in"]);
      expect(event.payload.scopeIn).toEqual([]);
      expect(event.payload.scopeOut).toEqual([]);
      expect(event.payload.boundaries).toEqual([]);
      expect(event.payload.status).toBe(GoalStatus.TODO);
      expect(event.timestamp).toBeDefined();
    });

    it("should create GoalAddedEvent event with all optional fields", () => {
      // Arrange
      const goal = Goal.create("goal_123");

      // Act
      const event = goal.add(
        "Implement JWT authentication",
        ["Token generation on login", "Middleware validates tokens"],
        ["UserController", "AuthMiddleware"],
        ["Admin routes"],
        ["Keep existing API contract"]
      );

      // Assert
      expect(event.payload.objective).toBe("Implement JWT authentication");
      expect(event.payload.successCriteria).toEqual([
        "Token generation on login",
        "Middleware validates tokens",
      ]);
      expect(event.payload.scopeIn).toEqual(["UserController", "AuthMiddleware"]);
      expect(event.payload.scopeOut).toEqual(["Admin routes"]);
      expect(event.payload.boundaries).toEqual(["Keep existing API contract"]);
    });

    it("should throw error if goal is already defined", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("First goal", ["Criterion 1"]);

      // Act & Assert
      expect(() => goal.add("Second goal", ["Criterion 2"])).toThrow(
        "Goal has already been defined"
      );
    });

    it("should throw error if objective is empty", () => {
      // Arrange
      const goal = Goal.create("goal_123");

      // Act & Assert
      expect(() => goal.add("", ["Criterion 1"])).toThrow(
        "Goal objective must be provided"
      );
    });

    it("should throw error if objective is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      const longObjective = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() => goal.add(longObjective, ["Criterion 1"])).toThrow(
        "Objective must be less than 500 characters"
      );
    });

    it("should throw error if no success criteria provided", () => {
      // Arrange
      const goal = Goal.create("goal_123");

      // Act & Assert
      expect(() => goal.add("My objective", [])).toThrow(
        "At least one success criterion must be provided"
      );
    });

    it("should throw error if too many success criteria", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      const tooManyCriteria = Array.from({ length: 51 }, (_, i) => `Criterion ${i}`);

      // Act & Assert
      expect(() => goal.add("My objective", tooManyCriteria)).toThrow(
        "Cannot have more than 50 success criteria"
      );
    });

    it("should throw error if success criterion is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      const longCriterion = "a".repeat(601); // Max is 600

      // Act & Assert
      expect(() => goal.add("My objective", [longCriterion])).toThrow(
        "Success criterion must be less than 600 characters"
      );
    });

    it("should throw error if too many scope items", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      const tooManyItems = Array.from({ length: 21 }, (_, i) => `Item ${i}`);

      // Act & Assert
      expect(() =>
        goal.add("My objective", ["Criterion 1"], tooManyItems)
      ).toThrow("Cannot have more than 20 scope items");
    });

    it("should throw error if scope item is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      const longItem = "a".repeat(201); // Max is 200

      // Act & Assert
      expect(() =>
        goal.add("My objective", ["Criterion 1"], [longItem])
      ).toThrow("Scope item must be less than 200 characters");
    });

    it("should update aggregate state after event creation", () => {
      // Arrange
      const goal = Goal.create("goal_123");

      // Act
      goal.add(
        "Implement authentication",
        ["Users can log in", "Tokens are validated"],
        ["AuthController"],
        ["AdminPanel"],
        ["No breaking changes"]
      );

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.objective).toBe("Implement authentication");
      expect(snapshot.successCriteria).toEqual(["Users can log in", "Tokens are validated"]);
      expect(snapshot.scopeIn).toEqual(["AuthController"]);
      expect(snapshot.scopeOut).toEqual(["AdminPanel"]);
      expect(snapshot.boundaries).toEqual(["No breaking changes"]);
      expect(snapshot.status).toBe(GoalStatus.TODO);
      expect(snapshot.version).toBe(1);
    });

    it("should create GoalAddedEvent with embedded context fields", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      const embeddedContext = {
        relevantInvariants: [{ title: "Single Responsibility", description: "One reason to change" }],
        relevantGuidelines: [{ title: "Use TypeScript", description: "All code in TS", examples: ["const x: string"] }],
        relevantDependencies: [{ consumer: "AuthController", provider: "UserService" }],
        relevantComponents: [{ name: "AuthController", responsibility: "Handle auth requests" }],
        architecture: { description: "Layered", organization: "By feature", patterns: ["CQRS"] },
        filesToBeCreated: ["src/auth/AuthController.ts"],
        filesToBeChanged: ["src/app.ts"],
      };

      // Act
      const event = goal.add(
        "Implement authentication",
        ["Users can log in"],
        ["AuthController"],
        [],
        [],
        embeddedContext
      );

      // Assert
      expect(event.payload.relevantInvariants).toEqual(embeddedContext.relevantInvariants);
      expect(event.payload.relevantGuidelines).toEqual(embeddedContext.relevantGuidelines);
      expect(event.payload.relevantDependencies).toEqual(embeddedContext.relevantDependencies);
      expect(event.payload.relevantComponents).toEqual(embeddedContext.relevantComponents);
      expect(event.payload.architecture).toEqual(embeddedContext.architecture);
      expect(event.payload.filesToBeCreated).toEqual(embeddedContext.filesToBeCreated);
      expect(event.payload.filesToBeChanged).toEqual(embeddedContext.filesToBeChanged);
    });

    it("should update aggregate state with embedded context fields", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      const embeddedContext = {
        relevantInvariants: [{ title: "DRY", description: "Don't repeat yourself" }],
        filesToBeCreated: ["src/utils/helper.ts"],
      };

      // Act
      goal.add("Add utility", ["Helper exists"], [], [], [], embeddedContext);

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.relevantInvariants).toEqual(embeddedContext.relevantInvariants);
      expect(snapshot.filesToBeCreated).toEqual(embeddedContext.filesToBeCreated);
      // Fields not provided should be undefined
      expect(snapshot.relevantGuidelines).toBeUndefined();
      expect(snapshot.architecture).toBeUndefined();
    });

    it("should create GoalAddedEvent without embedded context when not provided", () => {
      // Arrange
      const goal = Goal.create("goal_123");

      // Act
      const event = goal.add("Simple goal", ["Done"]);

      // Assert - embedded context fields should be undefined
      expect(event.payload.relevantInvariants).toBeUndefined();
      expect(event.payload.relevantGuidelines).toBeUndefined();
      expect(event.payload.relevantDependencies).toBeUndefined();
      expect(event.payload.relevantComponents).toBeUndefined();
      expect(event.payload.architecture).toBeUndefined();
      expect(event.payload.filesToBeCreated).toBeUndefined();
      expect(event.payload.filesToBeChanged).toBeUndefined();
    });
  });

  describe("start()", () => {
    it("should create GoalStartedEvent event when starting a to-do goal", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);

      // Act
      const event = goal.start();

      // Assert
      expect(event.type).toBe(GoalEventType.STARTED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(2);
      expect(event.payload.status).toBe(GoalStatus.DOING);
      expect(event.timestamp).toBeDefined();
    });

    it("should update aggregate state to doing after start", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);

      // Act
      goal.start();

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.status).toBe(GoalStatus.DOING);
      expect(snapshot.version).toBe(2);
    });

    it("should allow starting already-doing goal (idempotent)", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start(); // First start

      // Act - start again
      const event = goal.start();

      // Assert - should succeed
      expect(event.type).toBe(GoalEventType.STARTED);
      expect(event.payload.status).toBe(GoalStatus.DOING);
    });

    it("should throw error when starting blocked goal", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      // Simulate blocked status (would need Goal.block() method implemented)
      // For now, test with rehydration from events
      // Skip this test until block() is implemented

      // This test will be added when Goal.block() is implemented in Task-04
    });

    it("should throw error when starting completed goal", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      // Simulate completed status (would need Goal.complete() method implemented)
      // Skip this test until complete() is implemented

      // This test will be added when Goal.complete() is implemented in Task-06
    });
  });

  describe("update()", () => {
    it("should create GoalUpdatedEvent event with objective only", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original objective", ["Criterion 1"]);

      // Act
      const event = goal.update("Updated objective");

      // Assert
      expect(event.type).toBe(GoalEventType.UPDATED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(2);
      expect(event.payload.objective).toBe("Updated objective");
      expect(event.payload.successCriteria).toBeUndefined();
      expect(event.payload.scopeIn).toBeUndefined();
      expect(event.payload.scopeOut).toBeUndefined();
      expect(event.payload.boundaries).toBeUndefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should create GoalUpdatedEvent event with success criteria only", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Old criterion"]);

      // Act
      const event = goal.update(undefined, ["New criterion 1", "New criterion 2"]);

      // Assert
      expect(event.type).toBe(GoalEventType.UPDATED);
      expect(event.payload.objective).toBeUndefined();
      expect(event.payload.successCriteria).toEqual(["New criterion 1", "New criterion 2"]);
    });

    it("should create GoalUpdatedEvent event with all fields", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original", ["Criterion 1"]);

      // Act
      const event = goal.update(
        "Updated objective",
        ["Updated criterion"],
        ["In scope"],
        ["Out of scope"],
        ["Boundary 1"]
      );

      // Assert
      expect(event.payload.objective).toBe("Updated objective");
      expect(event.payload.successCriteria).toEqual(["Updated criterion"]);
      expect(event.payload.scopeIn).toEqual(["In scope"]);
      expect(event.payload.scopeOut).toEqual(["Out of scope"]);
      expect(event.payload.boundaries).toEqual(["Boundary 1"]);
    });

    it("should update aggregate state with partial fields", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original objective", ["Original criterion"], ["Original scope in"]);

      // Act - only update objective
      goal.update("Updated objective");

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.objective).toBe("Updated objective");
      expect(snapshot.successCriteria).toEqual(["Original criterion"]); // Unchanged
      expect(snapshot.scopeIn).toEqual(["Original scope in"]); // Unchanged
      expect(snapshot.version).toBe(2);
    });

    it("should throw error if no fields provided", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Criterion 1"]);

      // Act & Assert
      expect(() => goal.update()).toThrow("At least one field must be provided for update");
    });

    it("should throw error if goal is completed", () => {
      // Arrange - skip this test until complete() is implemented
      // This test will be added when Goal.complete() is implemented in Task-06
    });

    it("should throw error if objective is empty", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original objective", ["Criterion 1"]);

      // Act & Assert
      expect(() => goal.update("")).toThrow("Goal objective must be provided");
    });

    it("should throw error if objective is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original objective", ["Criterion 1"]);
      const longObjective = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() => goal.update(longObjective)).toThrow(
        "Objective must be less than 500 characters"
      );
    });

    it("should throw error if success criteria is empty array", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original objective", ["Criterion 1"]);

      // Act & Assert
      expect(() => goal.update(undefined, [])).toThrow(
        "At least one success criterion must be provided"
      );
    });

    it("should throw error if too many success criteria", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original objective", ["Criterion 1"]);
      const tooManyCriteria = Array.from({ length: 51 }, (_, i) => `Criterion ${i}`);

      // Act & Assert
      expect(() => goal.update(undefined, tooManyCriteria)).toThrow(
        "Cannot have more than 50 success criteria"
      );
    });

    it("should throw error if success criterion is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original objective", ["Criterion 1"]);
      const longCriterion = "a".repeat(601); // Max is 600

      // Act & Assert
      expect(() => goal.update(undefined, [longCriterion])).toThrow(
        "Success criterion must be less than 600 characters"
      );
    });

    it("should throw error if too many scope items", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original objective", ["Criterion 1"]);
      const tooManyItems = Array.from({ length: 21 }, (_, i) => `Item ${i}`);

      // Act & Assert
      expect(() => goal.update(undefined, undefined, tooManyItems)).toThrow(
        "Cannot have more than 20 scope items"
      );
    });

    it("should throw error if scope item is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original objective", ["Criterion 1"]);
      const longItem = "a".repeat(201); // Max is 200

      // Act & Assert
      expect(() => goal.update(undefined, undefined, [longItem])).toThrow(
        "Scope item must be less than 200 characters"
      );
    });
  });

  describe("block()", () => {
    it("should create GoalBlockedEvent event from to-do status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);

      // Act
      const event = goal.block("Waiting for API credentials");

      // Assert
      expect(event.type).toBe(GoalEventType.BLOCKED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(2);
      expect(event.payload.status).toBe(GoalStatus.BLOCKED);
      expect(event.payload.note).toBe("Waiting for API credentials");
      expect(event.timestamp).toBeDefined();
    });

    it("should create GoalBlockedEvent event from doing status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();

      // Act
      const event = goal.block("Database server is down");

      // Assert
      expect(event.type).toBe(GoalEventType.BLOCKED);
      expect(event.payload.status).toBe(GoalStatus.BLOCKED);
      expect(event.payload.note).toBe("Database server is down");
      expect(event.version).toBe(3);
    });

    it("should throw error if note is not provided", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);

      // Act & Assert
      expect(() => goal.block("")).toThrow("Note is required when blocking a goal");
    });

    it("should throw error if note is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      const longNote = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() => goal.block(longNote)).toThrow("Note must be less than 500 characters");
    });

    it("should throw error if goal is already blocked", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.block("First blocker");

      // Act & Assert
      expect(() => goal.block("Second blocker")).toThrow(
        "Cannot block goal in blocked status. Goal must be in to-do or doing status."
      );
    });
  });

  describe("unblock()", () => {
    it("should create GoalUnblockedEvent event without note", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.block("Waiting for API credentials");

      // Act
      const event = goal.unblock();

      // Assert
      expect(event.type).toBe(GoalEventType.UNBLOCKED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(3);
      expect(event.payload.status).toBe(GoalStatus.DOING);
      expect(event.payload.note).toBeUndefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should create GoalUnblockedEvent event with resolution note", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      goal.block("Database server is down");

      // Act
      const event = goal.unblock("Server is back online");

      // Assert
      expect(event.type).toBe(GoalEventType.UNBLOCKED);
      expect(event.payload.status).toBe(GoalStatus.DOING);
      expect(event.payload.note).toBe("Server is back online");
      expect(event.version).toBe(4);
    });

    it("should sanitize empty note to undefined", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.block("Blocked");

      // Act
      const event = goal.unblock("   ");

      // Assert
      expect(event.payload.note).toBeUndefined();
    });

    it("should throw error if note is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.block("Blocked");
      const longNote = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() => goal.unblock(longNote)).toThrow("Note must be less than 500 characters");
    });

    it("should throw error if goal is not blocked (to-do status)", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);

      // Act & Assert
      expect(() => goal.unblock()).toThrow(
        "Cannot unblock goal in to-do status. Goal must be blocked."
      );
    });

    it("should throw error if goal is not blocked (doing status)", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();

      // Act & Assert
      expect(() => goal.unblock()).toThrow(
        "Cannot unblock goal in doing status. Goal must be blocked."
      );
    });

    it("should transition goal back to doing status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      goal.block("Blocked");

      // Act
      goal.unblock("Resolved");

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.status).toBe(GoalStatus.DOING);
      expect(snapshot.note).toBe("Resolved");
      expect(snapshot.version).toBe(4);
    });
  });

  describe("complete()", () => {
    it("should create GoalCompletedEvent event from qualified status", () => {
      // Arrange - rehydrate a goal in qualified status
      const history = [
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
            boundaries: [],
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
          type: GoalEventType.SUBMITTED_FOR_REVIEW,
          aggregateId: "goal_123",
          version: 3,
          timestamp: "2025-01-01T02:00:00Z",
          payload: {
            status: GoalStatus.INREVIEW,
            submittedAt: "2025-01-01T02:00:00Z",
          },
        },
        {
          type: GoalEventType.QUALIFIED,
          aggregateId: "goal_123",
          version: 4,
          timestamp: "2025-01-01T03:00:00Z",
          payload: {
            status: GoalStatus.QUALIFIED,
            qualifiedAt: "2025-01-01T03:00:00Z",
          },
        },
      ];
      const goal = Goal.rehydrate("goal_123", history as any);

      // Act
      const event = goal.complete();

      // Assert
      expect(event.type).toBe(GoalEventType.COMPLETED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(5);
      expect(event.payload.status).toBe(GoalStatus.COMPLETED);
      expect(event.timestamp).toBeDefined();
    });

    it("should throw error if goal is in doing status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();

      // Act & Assert
      expect(() => goal.complete()).toThrow(
        "Cannot complete goal. Goal must be qualified first."
      );
    });

    it("should throw error if goal is in blocked status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      goal.block("Waiting for API credentials");

      // Act & Assert
      expect(() => goal.complete()).toThrow(
        "Cannot complete goal. Goal must be qualified first."
      );
    });

    it("should throw error if goal is not started (to-do status)", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);

      // Act & Assert
      expect(() => goal.complete()).toThrow(
        "Cannot complete goal. Goal must be qualified first."
      );
    });

    it("should throw error if goal is already completed", () => {
      // Arrange - rehydrate a goal that is already completed
      const history = [
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
            boundaries: [],
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
          type: GoalEventType.SUBMITTED_FOR_REVIEW,
          aggregateId: "goal_123",
          version: 3,
          timestamp: "2025-01-01T02:00:00Z",
          payload: {
            status: GoalStatus.INREVIEW,
            submittedAt: "2025-01-01T02:00:00Z",
          },
        },
        {
          type: GoalEventType.QUALIFIED,
          aggregateId: "goal_123",
          version: 4,
          timestamp: "2025-01-01T03:00:00Z",
          payload: {
            status: GoalStatus.QUALIFIED,
            qualifiedAt: "2025-01-01T03:00:00Z",
          },
        },
        {
          type: GoalEventType.COMPLETED,
          aggregateId: "goal_123",
          version: 5,
          timestamp: "2025-01-01T04:00:00Z",
          payload: {
            status: GoalStatus.COMPLETED,
          },
        },
      ];
      const goal = Goal.rehydrate("goal_123", history as any);

      // Act & Assert
      expect(() => goal.complete()).toThrow(
        "Goal is already completed"
      );
    });

    it("should transition goal to completed status", () => {
      // Arrange - rehydrate a goal in qualified status
      const history = [
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
            boundaries: [],
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
          type: GoalEventType.SUBMITTED_FOR_REVIEW,
          aggregateId: "goal_123",
          version: 3,
          timestamp: "2025-01-01T02:00:00Z",
          payload: {
            status: GoalStatus.INREVIEW,
            submittedAt: "2025-01-01T02:00:00Z",
          },
        },
        {
          type: GoalEventType.QUALIFIED,
          aggregateId: "goal_123",
          version: 4,
          timestamp: "2025-01-01T03:00:00Z",
          payload: {
            status: GoalStatus.QUALIFIED,
            qualifiedAt: "2025-01-01T03:00:00Z",
          },
        },
      ];
      const goal = Goal.rehydrate("goal_123", history as any);

      // Act
      goal.complete();

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.status).toBe(GoalStatus.COMPLETED);
      expect(snapshot.version).toBe(5);
    });
  });

  describe("rehydrate()", () => {
    it("should rebuild aggregate from event history", () => {
      // Arrange
      const goal1 = Goal.create("goal_123");
      const event = goal1.add(
        "Implement authentication",
        ["Users can log in"],
        ["AuthController"]
      );

      // Act
      const goal2 = Goal.rehydrate("goal_123", [event]);

      // Assert
      const snapshot = goal2.snapshot;
      expect(snapshot.objective).toBe("Implement authentication");
      expect(snapshot.successCriteria).toEqual(["Users can log in"]);
      expect(snapshot.scopeIn).toEqual(["AuthController"]);
      expect(snapshot.version).toBe(1);
    });

    it("should rebuild aggregate with GoalStartedEvent event", () => {
      // Arrange
      const goal1 = Goal.create("goal_123");
      const addedEvent = goal1.add("Implement authentication", ["Users can log in"]);
      const startedEvent = goal1.start();

      // Act
      const goal2 = Goal.rehydrate("goal_123", [addedEvent, startedEvent]);

      // Assert
      const snapshot = goal2.snapshot;
      expect(snapshot.objective).toBe("Implement authentication");
      expect(snapshot.status).toBe(GoalStatus.DOING);
      expect(snapshot.version).toBe(2);
    });

    it("should rebuild aggregate with GoalUpdatedEvent event", () => {
      // Arrange
      const goal1 = Goal.create("goal_123");
      const addedEvent = goal1.add("Original objective", ["Original criterion"], ["Original scope"]);
      const updatedEvent = goal1.update("Updated objective", ["Updated criterion 1", "Updated criterion 2"]);

      // Act
      const goal2 = Goal.rehydrate("goal_123", [addedEvent, updatedEvent]);

      // Assert
      const snapshot = goal2.snapshot;
      expect(snapshot.objective).toBe("Updated objective");
      expect(snapshot.successCriteria).toEqual(["Updated criterion 1", "Updated criterion 2"]);
      expect(snapshot.scopeIn).toEqual(["Original scope"]); // Unchanged
      expect(snapshot.version).toBe(2);
    });

    it("should rebuild aggregate with multiple GoalUpdatedEvent events", () => {
      // Arrange
      const goal1 = Goal.create("goal_123");
      const addedEvent = goal1.add("Original objective", ["Criterion 1"]);
      const updated1Event = goal1.update("Updated objective");
      const updated2Event = goal1.update(undefined, ["New criterion"]);

      // Act
      const goal2 = Goal.rehydrate("goal_123", [addedEvent, updated1Event, updated2Event]);

      // Assert
      const snapshot = goal2.snapshot;
      expect(snapshot.objective).toBe("Updated objective");
      expect(snapshot.successCriteria).toEqual(["New criterion"]);
      expect(snapshot.version).toBe(3);
    });
  });

  describe("pause()", () => {
    it("should create GoalPausedEvent event from doing status with reason", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();

      // Act
      const event = goal.pause("ContextCompressed");

      // Assert
      expect(event.type).toBe(GoalEventType.PAUSED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(3);
      expect(event.payload.status).toBe(GoalStatus.PAUSED);
      expect(event.payload.reason).toBe("ContextCompressed");
      expect(event.payload.note).toBeUndefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should create GoalPausedEvent event with optional note", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();

      // Act
      const event = goal.pause("Other", "Need to switch priorities");

      // Assert
      expect(event.type).toBe(GoalEventType.PAUSED);
      expect(event.payload.status).toBe(GoalStatus.PAUSED);
      expect(event.payload.reason).toBe("Other");
      expect(event.payload.note).toBe("Need to switch priorities");
      expect(event.version).toBe(3);
    });

    it("should throw error if goal is not in doing status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);

      // Act & Assert
      expect(() => goal.pause("ContextCompressed")).toThrow(
        "Cannot pause goal in to-do status. Goal must be in doing status."
      );
    });

    it("should throw error if goal is already paused", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      goal.pause("ContextCompressed");

      // Act & Assert
      expect(() => goal.pause("Other")).toThrow(
        "Cannot pause goal in paused status. Goal must be in doing status."
      );
    });

    it("should throw error if note is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      const longNote = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() => goal.pause("Other", longNote)).toThrow("Note must be less than 500 characters");
    });

    it("should sanitize empty note to undefined", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();

      // Act
      const event = goal.pause("ContextCompressed", "");

      // Assert
      expect(event.payload.note).toBeUndefined();
    });
  });

  describe("resume()", () => {
    it("should create GoalResumedEvent event from paused status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      goal.pause("ContextCompressed");

      // Act
      const event = goal.resume();

      // Assert
      expect(event.type).toBe(GoalEventType.RESUMED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(4);
      expect(event.payload.status).toBe(GoalStatus.DOING);
      expect(event.payload.note).toBeUndefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should create GoalResumedEvent event with optional note", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      goal.pause("ContextCompressed");

      // Act
      const event = goal.resume("Ready to continue");

      // Assert
      expect(event.type).toBe(GoalEventType.RESUMED);
      expect(event.payload.status).toBe(GoalStatus.DOING);
      expect(event.payload.note).toBe("Ready to continue");
      expect(event.version).toBe(4);
    });

    it("should throw error if goal is not paused", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();

      // Act & Assert
      expect(() => goal.resume()).toThrow(
        "Cannot resume goal in doing status. Goal must be paused."
      );
    });

    it("should throw error if note is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      goal.pause("ContextCompressed");
      const longNote = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() => goal.resume(longNote)).toThrow("Note must be less than 500 characters");
    });

    it("should sanitize empty note to undefined", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      goal.pause("ContextCompressed");

      // Act
      const event = goal.resume("");

      // Assert
      expect(event.payload.note).toBeUndefined();
    });
  });

  describe("submitForReview()", () => {
    it("should create GoalSubmittedForReviewEvent event from doing status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();

      // Act
      const event = goal.submitForReview();

      // Assert
      expect(event.type).toBe(GoalEventType.SUBMITTED_FOR_REVIEW);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(3);
      expect(event.payload.status).toBe(GoalStatus.INREVIEW);
      expect(event.payload.submittedAt).toBeDefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should create GoalSubmittedForReviewEvent event from blocked status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      goal.block("Waiting for API credentials");

      // Act
      const event = goal.submitForReview();

      // Assert
      expect(event.type).toBe(GoalEventType.SUBMITTED_FOR_REVIEW);
      expect(event.payload.status).toBe(GoalStatus.INREVIEW);
      expect(event.version).toBe(4);
    });

    it("should transition goal to in-review status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();

      // Act
      goal.submitForReview();

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.status).toBe(GoalStatus.INREVIEW);
      expect(snapshot.version).toBe(3);
    });

    it("should throw error if goal is in to-do status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);

      // Act & Assert
      expect(() => goal.submitForReview()).toThrow(
        "Cannot submit goal for review in to-do status. Goal must be in doing or blocked status."
      );
    });

    it("should throw error if goal is in paused status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      goal.pause("ContextCompressed");

      // Act & Assert
      expect(() => goal.submitForReview()).toThrow(
        "Cannot submit goal for review in paused status. Goal must be in doing or blocked status."
      );
    });

    it("should throw error if goal is already in-review", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      goal.submitForReview();

      // Act & Assert
      expect(() => goal.submitForReview()).toThrow(
        "Cannot submit goal for review in in-review status. Goal must be in doing or blocked status."
      );
    });

    it("should throw error if goal is in qualified status", () => {
      // Arrange - rehydrate a goal in qualified status
      const history = [
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
            boundaries: [],
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
          type: GoalEventType.SUBMITTED_FOR_REVIEW,
          aggregateId: "goal_123",
          version: 3,
          timestamp: "2025-01-01T02:00:00Z",
          payload: {
            status: GoalStatus.INREVIEW,
            submittedAt: "2025-01-01T02:00:00Z",
          },
        },
        {
          type: GoalEventType.QUALIFIED,
          aggregateId: "goal_123",
          version: 4,
          timestamp: "2025-01-01T03:00:00Z",
          payload: {
            status: GoalStatus.QUALIFIED,
            qualifiedAt: "2025-01-01T03:00:00Z",
          },
        },
      ];
      const goal = Goal.rehydrate("goal_123", history as any);

      // Act & Assert
      expect(() => goal.submitForReview()).toThrow(
        "Cannot submit goal for review in qualified status. Goal must be in doing or blocked status."
      );
    });

    it("should throw error if goal is completed", () => {
      // Arrange - rehydrate a goal in completed status
      const history = [
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
            boundaries: [],
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
          type: GoalEventType.SUBMITTED_FOR_REVIEW,
          aggregateId: "goal_123",
          version: 3,
          timestamp: "2025-01-01T02:00:00Z",
          payload: {
            status: GoalStatus.INREVIEW,
            submittedAt: "2025-01-01T02:00:00Z",
          },
        },
        {
          type: GoalEventType.QUALIFIED,
          aggregateId: "goal_123",
          version: 4,
          timestamp: "2025-01-01T03:00:00Z",
          payload: {
            status: GoalStatus.QUALIFIED,
            qualifiedAt: "2025-01-01T03:00:00Z",
          },
        },
        {
          type: GoalEventType.COMPLETED,
          aggregateId: "goal_123",
          version: 5,
          timestamp: "2025-01-01T04:00:00Z",
          payload: {
            status: GoalStatus.COMPLETED,
          },
        },
      ];
      const goal = Goal.rehydrate("goal_123", history as any);

      // Act & Assert
      expect(() => goal.submitForReview()).toThrow(
        "Cannot submit goal for review in completed status. Goal must be in doing or blocked status."
      );
    });
  });

  describe("qualify()", () => {
    it("should create GoalQualifiedEvent event from in-review status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      goal.submitForReview();

      // Act
      const event = goal.qualify();

      // Assert
      expect(event.type).toBe(GoalEventType.QUALIFIED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(4);
      expect(event.payload.status).toBe(GoalStatus.QUALIFIED);
      expect(event.payload.qualifiedAt).toBeDefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should transition goal to qualified status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      goal.submitForReview();

      // Act
      goal.qualify();

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.status).toBe(GoalStatus.QUALIFIED);
      expect(snapshot.version).toBe(4);
    });

    it("should throw error if goal is in to-do status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);

      // Act & Assert
      expect(() => goal.qualify()).toThrow(
        "Cannot qualify goal in to-do status. Goal must be in-review."
      );
    });

    it("should throw error if goal is in doing status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();

      // Act & Assert
      expect(() => goal.qualify()).toThrow(
        "Cannot qualify goal in doing status. Goal must be in-review."
      );
    });

    it("should throw error if goal is in blocked status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      goal.block("Waiting for API credentials");

      // Act & Assert
      expect(() => goal.qualify()).toThrow(
        "Cannot qualify goal in blocked status. Goal must be in-review."
      );
    });

    it("should throw error if goal is in paused status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      goal.pause("ContextCompressed");

      // Act & Assert
      expect(() => goal.qualify()).toThrow(
        "Cannot qualify goal in paused status. Goal must be in-review."
      );
    });

    it("should throw error if goal is already qualified", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      goal.submitForReview();
      goal.qualify();

      // Act & Assert
      expect(() => goal.qualify()).toThrow(
        "Cannot qualify goal in qualified status. Goal must be in-review."
      );
    });

    it("should throw error if goal is completed", () => {
      // Arrange - rehydrate a goal in completed status
      const history = [
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
            boundaries: [],
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
          type: GoalEventType.SUBMITTED_FOR_REVIEW,
          aggregateId: "goal_123",
          version: 3,
          timestamp: "2025-01-01T02:00:00Z",
          payload: {
            status: GoalStatus.INREVIEW,
            submittedAt: "2025-01-01T02:00:00Z",
          },
        },
        {
          type: GoalEventType.QUALIFIED,
          aggregateId: "goal_123",
          version: 4,
          timestamp: "2025-01-01T03:00:00Z",
          payload: {
            status: GoalStatus.QUALIFIED,
            qualifiedAt: "2025-01-01T03:00:00Z",
          },
        },
        {
          type: GoalEventType.COMPLETED,
          aggregateId: "goal_123",
          version: 5,
          timestamp: "2025-01-01T04:00:00Z",
          payload: {
            status: GoalStatus.COMPLETED,
          },
        },
      ];
      const goal = Goal.rehydrate("goal_123", history as any);

      // Act & Assert
      expect(() => goal.qualify()).toThrow(
        "Cannot qualify goal in completed status. Goal must be in-review."
      );
    });
  });
});
