/**
 * Tests for Goal.apply() and Goal.rehydrate() static methods
 * (formerly GoalProjection)
 */

import { Goal, GoalState } from "../../../../src/domain/goals/Goal";
import { GoalAddedEvent, GoalStartedEvent, GoalCompletedEvent, GoalPausedEvent, GoalResumedEvent, GoalSubmittedForReviewEvent, GoalQualifiedEvent } from "../../../../src/domain/goals/EventIndex";
import { GoalEventType, GoalStatus } from "../../../../src/domain/goals/Constants";

function createEmptyGoalState(id: string): GoalState {
  return {
    id,
    objective: "",
    successCriteria: [],
    scopeIn: [],
    scopeOut: [],
    boundaries: [],
    status: GoalStatus.TODO,
    version: 0,
    progress: [],
  };
}

describe("Goal", () => {
  describe("apply()", () => {
    it("should apply GoalAddedEvent event correctly", () => {
      // Arrange
      const state = {
        id: "goal_123",
        objective: "",
        successCriteria: [],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: 'to-do' as const,
        version: 0,
        progress: [],
      };

      const event: GoalAddedEvent = {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          objective: "Implement authentication",
          successCriteria: ["Users can log in"],
          scopeIn: ["AuthController"],
          scopeOut: ["AdminPanel"],
          boundaries: ["No breaking changes"],
          status: GoalStatus.TODO,
        },
      };

      // Act
      Goal.apply(state, event);

      // Assert
      expect(state.objective).toBe("Implement authentication");
      expect(state.successCriteria).toEqual(["Users can log in"]);
      expect(state.scopeIn).toEqual(["AuthController"]);
      expect(state.scopeOut).toEqual(["AdminPanel"]);
      expect(state.boundaries).toEqual(["No breaking changes"]);
      expect(state.status).toBe(GoalStatus.TODO);
      expect(state.version).toBe(1);
    });

    it("should apply GoalAddedEvent event with embedded context fields", () => {
      // Arrange
      const state = createEmptyGoalState("goal_123");

      const event: GoalAddedEvent = {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          objective: "Implement feature",
          successCriteria: ["Feature works"],
          scopeIn: [],
          scopeOut: [],
          boundaries: [],
          status: GoalStatus.TODO,
          relevantInvariants: [{ title: "SOLID", description: "Follow SOLID principles" }],
          relevantGuidelines: [{ title: "Testing", description: "Write tests first" }],
          relevantDependencies: [{ consumer: "ServiceA", provider: "ServiceB" }],
          relevantComponents: [{ name: "FeatureModule", responsibility: "Handle feature" }],
          architecture: { description: "Microservices", organization: "By domain" },
          filesToBeCreated: ["src/feature/index.ts"],
          filesToBeChanged: ["src/main.ts"],
        },
      };

      // Act
      Goal.apply(state, event);

      // Assert
      expect(state.relevantInvariants).toEqual([{ title: "SOLID", description: "Follow SOLID principles" }]);
      expect(state.relevantGuidelines).toEqual([{ title: "Testing", description: "Write tests first" }]);
      expect(state.relevantDependencies).toEqual([{ consumer: "ServiceA", provider: "ServiceB" }]);
      expect(state.relevantComponents).toEqual([{ name: "FeatureModule", responsibility: "Handle feature" }]);
      expect(state.architecture).toEqual({ description: "Microservices", organization: "By domain" });
      expect(state.filesToBeCreated).toEqual(["src/feature/index.ts"]);
      expect(state.filesToBeChanged).toEqual(["src/main.ts"]);
    });

    it("should not set embedded context fields when not provided in event", () => {
      // Arrange
      const state = createEmptyGoalState("goal_123");

      const event: GoalAddedEvent = {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          objective: "Simple goal",
          successCriteria: ["Done"],
          scopeIn: [],
          scopeOut: [],
          boundaries: [],
          status: GoalStatus.TODO,
        },
      };

      // Act
      Goal.apply(state, event);

      // Assert - embedded context fields should remain undefined
      expect(state.relevantInvariants).toBeUndefined();
      expect(state.relevantGuidelines).toBeUndefined();
      expect(state.relevantDependencies).toBeUndefined();
      expect(state.relevantComponents).toBeUndefined();
      expect(state.architecture).toBeUndefined();
      expect(state.filesToBeCreated).toBeUndefined();
      expect(state.filesToBeChanged).toBeUndefined();
    });

    it("should apply GoalStartedEvent event correctly", () => {
      // Arrange
      const state = {
        id: "goal_123",
        objective: "Implement authentication",
        successCriteria: ["Users can log in"],
        scopeIn: ["AuthController"],
        scopeOut: [],
        boundaries: [],
        status: GoalStatus.TODO,
        version: 1,
        progress: [],
      };

      const event: GoalStartedEvent = {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: new Date().toISOString(),
        payload: {
          status: GoalStatus.DOING,
        },
      };

      // Act
      Goal.apply(state, event);

      // Assert
      expect(state.status).toBe(GoalStatus.DOING);
      expect(state.version).toBe(2);
      // Other fields should remain unchanged
      expect(state.objective).toBe("Implement authentication");
      expect(state.successCriteria).toEqual(["Users can log in"]);
    });

    it("should apply GoalCompletedEvent event correctly", () => {
      // Arrange
      const state = {
        id: "goal_123",
        objective: "Implement authentication",
        successCriteria: ["Users can log in"],
        scopeIn: ["AuthController"],
        scopeOut: [],
        boundaries: [],
        status: GoalStatus.DOING,
        version: 2,
        progress: [],
      };

      const event: GoalCompletedEvent = {
        type: GoalEventType.COMPLETED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: new Date().toISOString(),
        payload: {
          status: GoalStatus.COMPLETED,
        },
      };

      // Act
      Goal.apply(state, event);

      // Assert
      expect(state.status).toBe(GoalStatus.COMPLETED);
      expect(state.version).toBe(3);
      // Other fields should remain unchanged
      expect(state.objective).toBe("Implement authentication");
      expect(state.successCriteria).toEqual(["Users can log in"]);
    });
  });

  describe("rehydrate()", () => {
    it("should rehydrate from empty history", () => {
      // Act
      const goal = Goal.rehydrate("goal_123", []);
      const state = goal.snapshot;

      // Assert
      expect(state.id).toBe("goal_123");
      expect(state.objective).toBe("");
      expect(state.successCriteria).toEqual([]);
      expect(state.version).toBe(0);
    });

    it("should rehydrate from single event", () => {
      // Arrange
      const event: GoalAddedEvent = {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          objective: "Implement authentication",
          successCriteria: ["Users can log in", "Tokens are validated"],
          scopeIn: ["AuthController"],
          scopeOut: [],
          boundaries: [],
          status: GoalStatus.TODO,
        },
      };

      // Act
      const goal = Goal.rehydrate("goal_123", [event]);
      const state = goal.snapshot;

      // Assert
      expect(state.objective).toBe("Implement authentication");
      expect(state.successCriteria).toEqual(["Users can log in", "Tokens are validated"]);
      expect(state.scopeIn).toEqual(["AuthController"]);
      expect(state.version).toBe(1);
    });

    it("should rehydrate from multiple events (GoalAddedEvent + GoalStartedEvent)", () => {
      // Arrange
      const addedEvent: GoalAddedEvent = {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          objective: "Implement authentication",
          successCriteria: ["Users can log in"],
          scopeIn: ["AuthController"],
          scopeOut: [],
          boundaries: [],
          status: GoalStatus.TODO,
        },
      };

      const startedEvent: GoalStartedEvent = {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: new Date().toISOString(),
        payload: {
          status: GoalStatus.DOING,
        },
      };

      // Act
      const goal = Goal.rehydrate("goal_123", [addedEvent, startedEvent]);
      const state = goal.snapshot;

      // Assert
      expect(state.objective).toBe("Implement authentication");
      expect(state.status).toBe(GoalStatus.DOING);
      expect(state.version).toBe(2);
    });
  });

  describe("apply() - GoalPausedEvent", () => {
    it("should apply GoalPausedEvent event correctly", () => {
      // Arrange
      const state = {
        id: "goal_123",
        objective: "Implement authentication",
        successCriteria: ["Users can log in"],
        scopeIn: ["AuthController"],
        scopeOut: [],
        boundaries: [],
        status: GoalStatus.DOING,
        version: 2,
        note: undefined,
        progress: [],
      };

      const event: GoalPausedEvent = {
        type: GoalEventType.PAUSED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: new Date().toISOString(),
        payload: {
          status: GoalStatus.PAUSED,
          reason: "ContextCompressed",
          note: "Pausing to compress context",
        },
      };

      // Act
      Goal.apply(state, event);

      // Assert
      expect(state.status).toBe(GoalStatus.PAUSED);
      expect(state.note).toBe("Pausing to compress context");
      expect(state.version).toBe(3);
      // Other fields should remain unchanged
      expect(state.objective).toBe("Implement authentication");
    });

    it("should apply GoalPausedEvent event without note", () => {
      // Arrange
      const state = {
        id: "goal_123",
        objective: "Implement authentication",
        successCriteria: ["Users can log in"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: GoalStatus.DOING,
        version: 2,
        note: undefined,
        progress: [],
      };

      const event: GoalPausedEvent = {
        type: GoalEventType.PAUSED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: new Date().toISOString(),
        payload: {
          status: GoalStatus.PAUSED,
          reason: "Other",
        },
      };

      // Act
      Goal.apply(state, event);

      // Assert
      expect(state.status).toBe(GoalStatus.PAUSED);
      expect(state.note).toBeUndefined();
      expect(state.version).toBe(3);
    });
  });

  describe("apply() - GoalResumedEvent", () => {
    it("should apply GoalResumedEvent event correctly", () => {
      // Arrange
      const state = {
        id: "goal_123",
        objective: "Implement authentication",
        successCriteria: ["Users can log in"],
        scopeIn: ["AuthController"],
        scopeOut: [],
        boundaries: [],
        status: GoalStatus.PAUSED,
        version: 3,
        note: undefined,
        progress: [],
      };

      const event: GoalResumedEvent = {
        type: GoalEventType.RESUMED,
        aggregateId: "goal_123",
        version: 4,
        timestamp: new Date().toISOString(),
        payload: {
          status: GoalStatus.DOING,
          note: "Ready to continue",
        },
      };

      // Act
      Goal.apply(state, event);

      // Assert
      expect(state.status).toBe(GoalStatus.DOING);
      expect(state.note).toBe("Ready to continue");
      expect(state.version).toBe(4);
      // Other fields should remain unchanged
      expect(state.objective).toBe("Implement authentication");
    });

    it("should apply GoalResumedEvent event without note", () => {
      // Arrange
      const state = {
        id: "goal_123",
        objective: "Implement authentication",
        successCriteria: ["Users can log in"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: GoalStatus.PAUSED,
        version: 3,
        note: undefined,
        progress: [],
      };

      const event: GoalResumedEvent = {
        type: GoalEventType.RESUMED,
        aggregateId: "goal_123",
        version: 4,
        timestamp: new Date().toISOString(),
        payload: {
          status: GoalStatus.DOING,
        },
      };

      // Act
      Goal.apply(state, event);

      // Assert
      expect(state.status).toBe(GoalStatus.DOING);
      expect(state.note).toBeUndefined();
      expect(state.version).toBe(4);
    });
  });

  describe("apply() - GoalSubmittedForReviewEvent", () => {
    it("should apply GoalSubmittedForReviewEvent event correctly", () => {
      // Arrange
      const state = {
        id: "goal_123",
        objective: "Implement authentication",
        successCriteria: ["Users can log in"],
        scopeIn: ["AuthController"],
        scopeOut: [],
        boundaries: [],
        status: GoalStatus.DOING,
        version: 2,
        note: undefined,
        progress: [],
      };

      const event: GoalSubmittedForReviewEvent = {
        type: GoalEventType.SUBMITTED_FOR_REVIEW,
        aggregateId: "goal_123",
        version: 3,
        timestamp: new Date().toISOString(),
        payload: {
          status: GoalStatus.INREVIEW,
          submittedAt: new Date().toISOString(),
        },
      };

      // Act
      Goal.apply(state, event);

      // Assert
      expect(state.status).toBe(GoalStatus.INREVIEW);
      expect(state.version).toBe(3);
      // Other fields should remain unchanged
      expect(state.objective).toBe("Implement authentication");
      expect(state.successCriteria).toEqual(["Users can log in"]);
    });

    it("should apply GoalSubmittedForReviewEvent from blocked status", () => {
      // Arrange
      const state = {
        id: "goal_123",
        objective: "Implement authentication",
        successCriteria: ["Users can log in"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: GoalStatus.BLOCKED,
        version: 3,
        note: "Waiting for API",
        progress: [],
      };

      const event: GoalSubmittedForReviewEvent = {
        type: GoalEventType.SUBMITTED_FOR_REVIEW,
        aggregateId: "goal_123",
        version: 4,
        timestamp: new Date().toISOString(),
        payload: {
          status: GoalStatus.INREVIEW,
          submittedAt: new Date().toISOString(),
        },
      };

      // Act
      Goal.apply(state, event);

      // Assert
      expect(state.status).toBe(GoalStatus.INREVIEW);
      expect(state.version).toBe(4);
      // Note should remain unchanged (not cleared by this event)
      expect(state.note).toBe("Waiting for API");
    });
  });

  describe("apply() - GoalQualifiedEvent", () => {
    it("should apply GoalQualifiedEvent event correctly", () => {
      // Arrange
      const state = {
        id: "goal_123",
        objective: "Implement authentication",
        successCriteria: ["Users can log in"],
        scopeIn: ["AuthController"],
        scopeOut: [],
        boundaries: [],
        status: GoalStatus.INREVIEW,
        version: 3,
        note: undefined,
        progress: [],
      };

      const event: GoalQualifiedEvent = {
        type: GoalEventType.QUALIFIED,
        aggregateId: "goal_123",
        version: 4,
        timestamp: new Date().toISOString(),
        payload: {
          status: GoalStatus.QUALIFIED,
          qualifiedAt: new Date().toISOString(),
        },
      };

      // Act
      Goal.apply(state, event);

      // Assert
      expect(state.status).toBe(GoalStatus.QUALIFIED);
      expect(state.version).toBe(4);
      // Other fields should remain unchanged
      expect(state.objective).toBe("Implement authentication");
      expect(state.successCriteria).toEqual(["Users can log in"]);
    });
  });

  describe("rehydrate() - full review workflow", () => {
    it("should rehydrate through complete review workflow (TODO -> DOING -> IN_REVIEW -> QUALIFIED -> COMPLETED)", () => {
      // Arrange
      const addedEvent: GoalAddedEvent = {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          objective: "Implement authentication",
          successCriteria: ["Users can log in"],
          scopeIn: ["AuthController"],
          scopeOut: [],
          boundaries: [],
          status: GoalStatus.TODO,
        },
      };

      const startedEvent: GoalStartedEvent = {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: new Date().toISOString(),
        payload: {
          status: GoalStatus.DOING,
        },
      };

      const submittedEvent: GoalSubmittedForReviewEvent = {
        type: GoalEventType.SUBMITTED_FOR_REVIEW,
        aggregateId: "goal_123",
        version: 3,
        timestamp: new Date().toISOString(),
        payload: {
          status: GoalStatus.INREVIEW,
          submittedAt: new Date().toISOString(),
        },
      };

      const qualifiedEvent: GoalQualifiedEvent = {
        type: GoalEventType.QUALIFIED,
        aggregateId: "goal_123",
        version: 4,
        timestamp: new Date().toISOString(),
        payload: {
          status: GoalStatus.QUALIFIED,
          qualifiedAt: new Date().toISOString(),
        },
      };

      const completedEvent: GoalCompletedEvent = {
        type: GoalEventType.COMPLETED,
        aggregateId: "goal_123",
        version: 5,
        timestamp: new Date().toISOString(),
        payload: {
          status: GoalStatus.COMPLETED,
        },
      };

      // Act
      const goal = Goal.rehydrate("goal_123", [
        addedEvent,
        startedEvent,
        submittedEvent,
        qualifiedEvent,
        completedEvent,
      ]);
      const state = goal.snapshot;

      // Assert
      expect(state.objective).toBe("Implement authentication");
      expect(state.status).toBe(GoalStatus.COMPLETED);
      expect(state.version).toBe(5);
    });
  });
});
