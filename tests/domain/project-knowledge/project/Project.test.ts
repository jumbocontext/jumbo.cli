/**
 * Tests for Project aggregate
 */

import { Project } from "../../../../src/domain/project/Project";
import { ProjectEventType } from "../../../../src/domain/project/Constants";

describe("Project Aggregate", () => {
  describe("initialize()", () => {
    it("should create ProjectInitialized event with required fields", () => {
      // Arrange
      const project = Project.create("project");

      // Act
      const event = project.initialize("My Project");

      // Assert
      expect(event.type).toBe(ProjectEventType.INITIALIZED);
      expect(event.aggregateId).toBe("project");
      expect(event.version).toBe(1);
      expect(event.payload.name).toBe("My Project");
      expect(event.payload.purpose).toBeNull();
      expect(event.payload.boundaries).toEqual([]);
      expect(event.timestamp).toBeDefined();
    });

    it("should create ProjectInitialized event with all optional fields", () => {
      // Arrange
      const project = Project.create("project");

      // Act
      const event = project.initialize(
        "My Project",
        "Context management for LLM coding agents",
        ["Does not replace git", "Does not execute code"]
      );

      // Assert
      expect(event.payload.name).toBe("My Project");
      expect(event.payload.purpose).toBe("Context management for LLM coding agents");
      expect(event.payload.boundaries).toEqual([
        "Does not replace git",
        "Does not execute code",
      ]);
    });

    it("should throw error if project is already initialized", () => {
      // Arrange
      const project = Project.create("project");
      project.initialize("My Project");

      // Act & Assert
      expect(() => project.initialize("Another Project")).toThrow(
        "Project is already initialized"
      );
    });

    it("should throw error if name is empty", () => {
      // Arrange
      const project = Project.create("project");

      // Act & Assert
      expect(() => project.initialize("")).toThrow(
        "Project name must be provided"
      );
    });

    it("should throw error if name is too long", () => {
      // Arrange
      const project = Project.create("project");
      const longName = "a".repeat(101); // Max is 100

      // Act & Assert
      expect(() => project.initialize(longName)).toThrow(
        "Project name must be less than 100 characters"
      );
    });

    it("should throw error if purpose is too long", () => {
      // Arrange
      const project = Project.create("project");
      const longPurpose = "a".repeat(1001); // Max is 1000

      // Act & Assert
      expect(() =>
        project.initialize("My Project", longPurpose)
      ).toThrow("Purpose must be less than 1000 characters");
    });

    it("should throw error if too many boundaries", () => {
      // Arrange
      const project = Project.create("project");
      const tooManyBoundaries = Array.from({ length: 21 }, (_, i) => `Boundary ${i}`);

      // Act & Assert
      expect(() =>
        project.initialize("My Project", undefined, tooManyBoundaries)
      ).toThrow("Cannot have more than 20 boundaries");
    });

    it("should throw error if boundary item is too long", () => {
      // Arrange
      const project = Project.create("project");
      const longBoundary = "a".repeat(201); // Max is 200

      // Act & Assert
      expect(() =>
        project.initialize("My Project", undefined, [longBoundary])
      ).toThrow("Boundary item must be less than 200 characters");
    });

    it("should update aggregate state after event creation", () => {
      // Arrange
      const project = Project.create("project");

      // Act
      project.initialize("My Project", "Amazing purpose", [
        "Boundary 1",
      ]);

      // Assert
      const snapshot = project.snapshot;
      expect(snapshot.name).toBe("My Project");
      expect(snapshot.purpose).toBe("Amazing purpose");
      expect(snapshot.boundaries).toEqual(["Boundary 1"]);
      expect(snapshot.version).toBe(1);
    });
  });

  describe("rehydrate()", () => {
    it("should rebuild aggregate from event history", () => {
      // Arrange
      const project1 = Project.create("project");
      const event = project1.initialize("My Project", "Great purpose");

      // Act
      const project2 = Project.rehydrate("project", [event]);

      // Assert
      const snapshot = project2.snapshot;
      expect(snapshot.name).toBe("My Project");
      expect(snapshot.purpose).toBe("Great purpose");
      expect(snapshot.version).toBe(1);
    });
  });

  describe("update()", () => {
    it("should throw error if project is not initialized", () => {
      // Arrange
      const project = Project.create("project");

      // Act & Assert
      expect(() => project.update("New purpose")).toThrow(
        "Project must be initialized before updating"
      );
    });

    it("should return null if no changes provided", () => {
      // Arrange
      const project = Project.create("project");
      project.initialize("My Project", "Original purpose");

      // Act
      const event = project.update();

      // Assert
      expect(event).toBeNull();
    });

    it("should return null if values are unchanged", () => {
      // Arrange
      const project = Project.create("project");
      project.initialize("My Project", "Original purpose");

      // Act
      const event = project.update("Original purpose");

      // Assert
      expect(event).toBeNull();
    });

    it("should create ProjectUpdated event with only changed purpose", () => {
      // Arrange
      const project = Project.create("project");
      project.initialize("My Project", "Original purpose");

      // Act
      const event = project.update("New purpose");

      // Assert
      expect(event).not.toBeNull();
      expect(event!.type).toBe(ProjectEventType.UPDATED);
      expect(event!.aggregateId).toBe("project");
      expect(event!.version).toBe(2);
      expect(event!.payload.purpose).toBe("New purpose");
      expect(event!.payload.boundaries).toBeUndefined();
    });

    it("should create ProjectUpdated event with only changed boundaries", () => {
      // Arrange
      const project = Project.create("project");
      project.initialize("My Project", "Original purpose", ["Old boundary"]);

      // Act
      const event = project.update(undefined, ["New boundary 1", "New boundary 2"]);

      // Assert
      expect(event).not.toBeNull();
      expect(event!.payload.purpose).toBeUndefined();
      expect(event!.payload.boundaries).toEqual(["New boundary 1", "New boundary 2"]);
    });

    it("should create ProjectUpdated event with multiple changed fields", () => {
      // Arrange
      const project = Project.create("project");
      project.initialize("My Project", "Original purpose");

      // Act
      const event = project.update("New purpose", ["Boundary 1"]);

      // Assert
      expect(event).not.toBeNull();
      expect(event!.payload.purpose).toBe("New purpose");
      expect(event!.payload.boundaries).toEqual(["Boundary 1"]);
    });

    it("should allow setting purpose to null", () => {
      // Arrange
      const project = Project.create("project");
      project.initialize("My Project", "Original purpose");

      // Act
      const event = project.update(null);

      // Assert
      expect(event).not.toBeNull();
      expect(event!.payload.purpose).toBeNull();
    });

    it("should throw error if purpose is too long", () => {
      // Arrange
      const project = Project.create("project");
      project.initialize("My Project");
      const longPurpose = "a".repeat(1001); // Max is 1000

      // Act & Assert
      expect(() => project.update(longPurpose)).toThrow(
        "Purpose must be less than 1000 characters"
      );
    });

    it("should throw error if too many boundaries", () => {
      // Arrange
      const project = Project.create("project");
      project.initialize("My Project");
      const tooManyBoundaries = Array.from({ length: 21 }, (_, i) => `Boundary ${i}`);

      // Act & Assert
      expect(() => project.update(undefined, tooManyBoundaries)).toThrow(
        "Cannot have more than 20 boundaries"
      );
    });

    it("should update aggregate state after event creation", () => {
      // Arrange
      const project = Project.create("project");
      project.initialize("My Project", "Original purpose");

      // Act
      project.update("New purpose");

      // Assert
      const snapshot = project.snapshot;
      expect(snapshot.name).toBe("My Project"); // Name unchanged
      expect(snapshot.purpose).toBe("New purpose");
      expect(snapshot.version).toBe(2);
    });

    it("should rehydrate correctly with both initialized and updated events", () => {
      // Arrange
      const project1 = Project.create("project");
      const initEvent = project1.initialize("My Project", "Original purpose");
      const updateEvent = project1.update("New purpose");

      // Act
      const project2 = Project.rehydrate("project", [initEvent, updateEvent!]);

      // Assert
      const snapshot = project2.snapshot;
      expect(snapshot.name).toBe("My Project");
      expect(snapshot.purpose).toBe("New purpose");
      expect(snapshot.version).toBe(2);
    });
  });
});
