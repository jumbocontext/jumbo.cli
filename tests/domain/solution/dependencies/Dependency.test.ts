/**
 * Tests for Dependency aggregate
 */

import { Dependency } from "../../../../src/domain/dependencies/Dependency";
import { DependencyEventType, DependencyStatus } from "../../../../src/domain/dependencies/Constants";

describe("Dependency Aggregate", () => {
  describe("add()", () => {
    it("should create DependencyAdded event with required fields only", () => {
      // Arrange
      const dependency = Dependency.create("dep_123");

      // Act
      const event = dependency.add("ConsumerService", "ProviderService");

      // Assert
      expect(event.type).toBe(DependencyEventType.ADDED);
      expect(event.aggregateId).toBe("dep_123");
      expect(event.version).toBe(1);
      expect(event.payload.consumerId).toBe("ConsumerService");
      expect(event.payload.providerId).toBe("ProviderService");
      expect(event.payload.endpoint).toBeNull();
      expect(event.payload.contract).toBeNull();
      expect(event.timestamp).toBeDefined();
    });

    it("should create DependencyAdded event with optional endpoint and contract", () => {
      // Arrange
      const dependency = Dependency.create("dep_456");

      // Act
      const event = dependency.add(
        "UserService",
        "DatabaseClient",
        "/api/users",
        "IUserRepository"
      );

      // Assert
      expect(event.payload.consumerId).toBe("UserService");
      expect(event.payload.providerId).toBe("DatabaseClient");
      expect(event.payload.endpoint).toBe("/api/users");
      expect(event.payload.contract).toBe("IUserRepository");
    });

    it("should throw error if endpoint is too long", () => {
      // Arrange
      const dependency = Dependency.create("dep_123");
      const longEndpoint = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() => dependency.add("Consumer", "Provider", longEndpoint)).toThrow(
        "Endpoint must be less than 500 characters"
      );
    });

    it("should throw error if contract is too long", () => {
      // Arrange
      const dependency = Dependency.create("dep_123");
      const longContract = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() => dependency.add("Consumer", "Provider", undefined, longContract)).toThrow(
        "Contract must be less than 500 characters"
      );
    });
  });

  describe("update()", () => {
    it("should create DependencyUpdated event when updating endpoint only", () => {
      // Arrange
      const dependency = Dependency.create("dep_123");
      dependency.add("Consumer", "Provider");

      // Act
      const event = dependency.update("/api/v2/users");

      // Assert
      expect(event.type).toBe(DependencyEventType.UPDATED);
      expect(event.aggregateId).toBe("dep_123");
      expect(event.version).toBe(2);
      expect(event.payload.endpoint).toBe("/api/v2/users");
      expect(event.payload.contract).toBeUndefined();
      expect(event.payload.status).toBeUndefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should create DependencyUpdated event when updating contract only", () => {
      // Arrange
      const dependency = Dependency.create("dep_123");
      dependency.add("Consumer", "Provider");

      // Act
      const event = dependency.update(undefined, "REST API v2");

      // Assert
      expect(event.type).toBe(DependencyEventType.UPDATED);
      expect(event.payload.endpoint).toBeUndefined();
      expect(event.payload.contract).toBe("REST API v2");
      expect(event.payload.status).toBeUndefined();
    });

    it("should create DependencyUpdated event when updating status only", () => {
      // Arrange
      const dependency = Dependency.create("dep_123");
      dependency.add("Consumer", "Provider");

      // Act
      const event = dependency.update(undefined, undefined, DependencyStatus.DEPRECATED);

      // Assert
      expect(event.type).toBe(DependencyEventType.UPDATED);
      expect(event.payload.endpoint).toBeUndefined();
      expect(event.payload.contract).toBeUndefined();
      expect(event.payload.status).toBe(DependencyStatus.DEPRECATED);
    });

    it("should create DependencyUpdated event when updating multiple fields", () => {
      // Arrange
      const dependency = Dependency.create("dep_123");
      dependency.add("Consumer", "Provider");

      // Act
      const event = dependency.update(
        "/api/v3/users",
        "gRPC service",
        DependencyStatus.ACTIVE
      );

      // Assert
      expect(event.payload.endpoint).toBe("/api/v3/users");
      expect(event.payload.contract).toBe("gRPC service");
      expect(event.payload.status).toBe(DependencyStatus.ACTIVE);
    });

    it("should allow clearing endpoint by setting it to null", () => {
      // Arrange
      const dependency = Dependency.create("dep_123");
      dependency.add("Consumer", "Provider", "/api/old");

      // Act
      const event = dependency.update(null);

      // Assert
      expect(event.payload.endpoint).toBeNull();
    });

    it("should allow clearing contract by setting it to null", () => {
      // Arrange
      const dependency = Dependency.create("dep_123");
      dependency.add("Consumer", "Provider", undefined, "Old Contract");

      // Act
      const event = dependency.update(undefined, null);

      // Assert
      expect(event.payload.contract).toBeNull();
    });

    it("should throw error if endpoint is too long", () => {
      // Arrange
      const dependency = Dependency.create("dep_123");
      dependency.add("Consumer", "Provider");
      const longEndpoint = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() => dependency.update(longEndpoint)).toThrow(
        "Endpoint must be less than 500 characters"
      );
    });

    it("should throw error if contract is too long", () => {
      // Arrange
      const dependency = Dependency.create("dep_123");
      dependency.add("Consumer", "Provider");
      const longContract = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() => dependency.update(undefined, longContract)).toThrow(
        "Contract must be less than 500 characters"
      );
    });

    it("should throw error if status is invalid", () => {
      // Arrange
      const dependency = Dependency.create("dep_123");
      dependency.add("Consumer", "Provider");

      // Act & Assert
      expect(() => dependency.update(undefined, undefined, "invalid" as any)).toThrow(
        "Status must be one of: active, deprecated, removed"
      );
    });
  });

  describe("remove()", () => {
    it("should create DependencyRemoved event without reason", () => {
      // Arrange
      const dependency = Dependency.create("dep_123");
      dependency.add("Consumer", "Provider");

      // Act
      const event = dependency.remove();

      // Assert
      expect(event.type).toBe(DependencyEventType.REMOVED);
      expect(event.aggregateId).toBe("dep_123");
      expect(event.version).toBe(2);
      expect(event.payload.reason).toBeNull();
      expect(event.timestamp).toBeDefined();
    });

    it("should create DependencyRemoved event with reason", () => {
      // Arrange
      const dependency = Dependency.create("dep_456");
      dependency.add("UserService", "DatabaseClient");

      // Act
      const event = dependency.remove("Migrated to MongoDB");

      // Assert
      expect(event.type).toBe(DependencyEventType.REMOVED);
      expect(event.aggregateId).toBe("dep_456");
      expect(event.version).toBe(2);
      expect(event.payload.reason).toBe("Migrated to MongoDB");
    });

    it("should throw error if dependency is already removed", () => {
      // Arrange
      const dependency = Dependency.create("dep_789");
      dependency.add("Consumer", "Provider");
      dependency.remove("First removal");

      // Act & Assert
      expect(() => dependency.remove("Second removal")).toThrow(
        "Dependency is already removed"
      );
    });

    it("should increment version correctly", () => {
      // Arrange
      const dependency = Dependency.create("dep_123");
      dependency.add("Consumer", "Provider"); // version 1
      dependency.update("/api/v2"); // version 2

      // Act
      const event = dependency.remove("No longer needed");

      // Assert
      expect(event.version).toBe(3);
    });
  });
});
