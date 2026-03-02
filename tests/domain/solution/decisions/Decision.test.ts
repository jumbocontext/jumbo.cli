/**
 * Tests for Decision aggregate
 */

import { Decision } from "../../../../src/domain/decisions/Decision.js";
import { DecisionEventType, DecisionStatus } from "../../../../src/domain/decisions/Constants.js";

describe("Decision aggregate", () => {
  describe("reverse()", () => {
    it("should reverse an active decision with valid reason", () => {
      // Arrange
      const decision = Decision.create("dec_123");
      decision.add("Use REST API", "Need an API layer", "REST is standard");

      // Act
      const event = decision.reverse("Requirements changed to GraphQL");

      // Assert
      expect(event.type).toBe(DecisionEventType.REVERSED);
      expect(event.aggregateId).toBe("dec_123");
      expect(event.version).toBe(2);
      expect(event.payload.reason).toBe("Requirements changed to GraphQL");
      expect(event.payload.reversedAt).toBeDefined();
      expect(new Date(event.payload.reversedAt).getTime()).not.toBeNaN();
    });

    it("should trim whitespace from reason", () => {
      // Arrange
      const decision = Decision.create("dec_123");
      decision.add("Use REST API", "Need an API layer");

      // Act
      const event = decision.reverse("  Requirements changed  ");

      // Assert
      expect(event.payload.reason).toBe("Requirements changed");
    });

    it("should throw error if reason is empty", () => {
      // Arrange
      const decision = Decision.create("dec_123");
      decision.add("Use REST API", "Need an API layer");

      // Act & Assert
      expect(() => decision.reverse("")).toThrow("Reason for reversal must be provided");
    });

    it("should throw error if reason is whitespace-only", () => {
      // Arrange
      const decision = Decision.create("dec_123");
      decision.add("Use REST API", "Need an API layer");

      // Act & Assert
      expect(() => decision.reverse("   ")).toThrow("Reason for reversal must be provided");
    });

    it("should throw error if reason exceeds max length", () => {
      // Arrange
      const decision = Decision.create("dec_123");
      decision.add("Use REST API", "Need an API layer");
      const longReason = "A".repeat(501); // Max is 500

      // Act & Assert
      expect(() => decision.reverse(longReason)).toThrow("Reversal reason must be less than");
    });

    it("should throw error if decision is already reversed", () => {
      // Arrange
      const decision = Decision.create("dec_123");
      decision.add("Use REST API", "Need an API layer");
      decision.reverse("First reversal");

      // Act & Assert
      expect(() => decision.reverse("Second reversal")).toThrow("Decision is already reversed");
    });

    it("should throw error if decision is superseded", () => {
      // Arrange
      const decision = Decision.create("dec_123");
      decision.add("Use REST API", "Need an API layer");
      decision.supersede("dec_456");

      // Act & Assert
      expect(() => decision.reverse("Cannot reverse superseded")).toThrow("Cannot modify a reversed or superseded decision");
    });

    it("should update state correctly after reversal", () => {
      // Arrange
      const decision = Decision.create("dec_123");
      decision.add("Use REST API", "Need an API layer");

      // Act
      decision.reverse("Requirements changed");

      // Assert
      const state = (decision as any).state; // Access private state for testing
      expect(state.status).toBe(DecisionStatus.REVERSED);
      expect(state.reversalReason).toBe("Requirements changed");
      expect(state.reversedAt).toBeDefined();
      expect(state.version).toBe(2);
    });

    it("should preserve original decision properties after reversal", () => {
      // Arrange
      const decision = Decision.create("dec_123");
      decision.add(
        "Use REST API",
        "Need an API layer",
        "REST is well-supported",
        ["GraphQL", "gRPC"],
        "Easier to implement"
      );

      // Act
      decision.reverse("Requirements changed");

      // Assert
      const state = (decision as any).state;
      expect(state.title).toBe("Use REST API");
      expect(state.context).toBe("Need an API layer");
      expect(state.rationale).toBe("REST is well-supported");
      expect(state.alternatives).toEqual(["GraphQL", "gRPC"]);
      expect(state.consequences).toBe("Easier to implement");
    });
  });

  describe("rehydrate() with reverse events", () => {
    it("should rebuild state correctly from event history including reversal", () => {
      // Arrange
      const events = [
        {
          type: DecisionEventType.ADDED,
          aggregateId: "dec_123",
          version: 1,
          timestamp: "2025-11-09T10:00:00Z",
          payload: {
            title: "Use REST API",
            context: "Need API layer",
            rationale: "Standard approach",
            alternatives: ["GraphQL"],
            consequences: "Easy to implement"
          }
        },
        {
          type: DecisionEventType.REVERSED,
          aggregateId: "dec_123",
          version: 2,
          timestamp: "2025-11-09T11:00:00Z",
          payload: {
            reason: "Requirements changed",
            reversedAt: "2025-11-09T11:00:00Z"
          }
        }
      ];

      // Act
      const decision = Decision.rehydrate("dec_123", events as any);

      // Assert
      const state = (decision as any).state;
      expect(state.status).toBe(DecisionStatus.REVERSED);
      expect(state.reversalReason).toBe("Requirements changed");
      expect(state.reversedAt).toBe("2025-11-09T11:00:00Z");
      expect(state.version).toBe(2);
      expect(state.title).toBe("Use REST API");
    });
  });

  describe("supersede()", () => {
    it("should supersede an active decision with valid supersededBy ID", () => {
      // Arrange
      const decision = Decision.create("dec_123");
      decision.add("Use JWT", "Need authentication", "JWT is standard");

      // Act
      const event = decision.supersede("dec_456");

      // Assert
      expect(event.type).toBe(DecisionEventType.SUPERSEDED);
      expect(event.aggregateId).toBe("dec_123");
      expect(event.version).toBe(2);
      expect(event.payload.supersededBy).toBe("dec_456");
    });

    it("should throw error if supersededBy is empty", () => {
      // Arrange
      const decision = Decision.create("dec_123");
      decision.add("Use JWT", "Need authentication");

      // Act & Assert
      expect(() => decision.supersede("")).toThrow("SupersededBy decision ID must be provided");
    });

    it("should throw error if supersededBy is whitespace-only", () => {
      // Arrange
      const decision = Decision.create("dec_123");
      decision.add("Use JWT", "Need authentication");

      // Act & Assert
      expect(() => decision.supersede("   ")).toThrow("SupersededBy decision ID must be provided");
    });

    it("should throw error if decision is already superseded", () => {
      // Arrange
      const decision = Decision.create("dec_123");
      decision.add("Use JWT", "Need authentication");
      decision.supersede("dec_456");

      // Act & Assert
      expect(() => decision.supersede("dec_789")).toThrow("Decision is already superseded");
    });

    it("should throw error if decision is reversed", () => {
      // Arrange
      const decision = Decision.create("dec_123");
      decision.add("Use JWT", "Need authentication");
      decision.reverse("No longer needed");

      // Act & Assert
      expect(() => decision.supersede("dec_456")).toThrow("Cannot modify a reversed or superseded decision");
    });

    it("should update state correctly after superseding", () => {
      // Arrange
      const decision = Decision.create("dec_123");
      decision.add("Use JWT", "Need authentication");

      // Act
      decision.supersede("dec_456");

      // Assert
      const state = (decision as any).state;
      expect(state.status).toBe(DecisionStatus.SUPERSEDED);
      expect(state.supersededBy).toBe("dec_456");
      expect(state.version).toBe(2);
    });

    it("should preserve original decision properties after superseding", () => {
      // Arrange
      const decision = Decision.create("dec_123");
      decision.add(
        "Use JWT",
        "Need authentication",
        "JWT is well-supported",
        ["OAuth", "SAML"],
        "Easy to implement"
      );

      // Act
      decision.supersede("dec_456");

      // Assert
      const state = (decision as any).state;
      expect(state.title).toBe("Use JWT");
      expect(state.context).toBe("Need authentication");
      expect(state.rationale).toBe("JWT is well-supported");
      expect(state.alternatives).toEqual(["OAuth", "SAML"]);
      expect(state.consequences).toBe("Easy to implement");
    });
  });

  describe("rehydrate() with supersede events", () => {
    it("should rebuild state correctly from event history including supersede", () => {
      // Arrange
      const events = [
        {
          type: DecisionEventType.ADDED,
          aggregateId: "dec_123",
          version: 1,
          timestamp: "2025-11-09T10:00:00Z",
          payload: {
            title: "Use JWT",
            context: "Need authentication",
            rationale: "Standard approach",
            alternatives: ["OAuth"],
            consequences: "Easy to implement"
          }
        },
        {
          type: DecisionEventType.SUPERSEDED,
          aggregateId: "dec_123",
          version: 2,
          timestamp: "2025-11-09T11:00:00Z",
          payload: {
            supersededBy: "dec_456"
          }
        }
      ];

      // Act
      const decision = Decision.rehydrate("dec_123", events as any);

      // Assert
      const state = (decision as any).state;
      expect(state.status).toBe(DecisionStatus.SUPERSEDED);
      expect(state.supersededBy).toBe("dec_456");
      expect(state.version).toBe(2);
      expect(state.title).toBe("Use JWT");
    });
  });

  describe("restore()", () => {
    it("should restore a reversed decision to active", () => {
      const decision = Decision.create("dec_123");
      decision.add("Use REST API", "Need an API layer");
      decision.reverse("No longer needed");

      const event = decision.restore("Decision still applies");

      expect(event.type).toBe(DecisionEventType.RESTORED);
      expect(event.aggregateId).toBe("dec_123");
      expect(event.version).toBe(3);
      expect(event.payload.reason).toBe("Decision still applies");
      expect(event.payload.restoredAt).toBeDefined();
    });

    it("should restore a superseded decision to active", () => {
      const decision = Decision.create("dec_123");
      decision.add("Use REST API", "Need an API layer");
      decision.supersede("dec_456");

      const event = decision.restore("Superseding decision was invalid");

      expect(event.type).toBe(DecisionEventType.RESTORED);
      expect(event.version).toBe(3);
    });

    it("should throw if decision is already active", () => {
      const decision = Decision.create("dec_123");
      decision.add("Use REST API", "Need an API layer");

      expect(() => decision.restore("Still active")).toThrow("Decision is already active");
    });

    it("should clear reversal and supersession fields when restored", () => {
      const decision = Decision.create("dec_123");
      decision.add("Use REST API", "Need an API layer");
      decision.reverse("No longer needed");
      decision.restore("Still valid");

      const state = (decision as any).state;
      expect(state.status).toBe(DecisionStatus.ACTIVE);
      expect(state.reversalReason).toBeNull();
      expect(state.reversedAt).toBeNull();
      expect(state.supersededBy).toBeNull();
    });
  });
});
