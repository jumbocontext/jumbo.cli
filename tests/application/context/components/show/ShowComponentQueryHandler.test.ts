/**
 * Tests for ShowComponentQueryHandler
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ShowComponentQueryHandler } from "../../../../../src/application/context/components/show/ShowComponentQueryHandler.js";
import { IComponentReader } from "../../../../../src/application/context/components/get/IComponentReader.js";
import { IRelationListReader } from "../../../../../src/application/context/relations/list/IRelationListReader.js";
import { ComponentView } from "../../../../../src/application/context/components/ComponentView.js";
import { RelationView } from "../../../../../src/application/context/relations/RelationView.js";

describe("ShowComponentQueryHandler", () => {
  let queryHandler: ShowComponentQueryHandler;
  let mockComponentReader: jest.Mocked<IComponentReader>;
  let mockRelationListReader: jest.Mocked<IRelationListReader>;

  const mockComponent: ComponentView = {
    componentId: "comp_123",
    name: "UserService",
    type: "service",
    description: "Handles user operations",
    responsibility: "User management",
    path: "src/services/user",
    status: "active",
    deprecationReason: null,
    version: 1,
    createdAt: "2025-01-01T10:00:00Z",
    updatedAt: "2025-01-01T10:00:00Z",
  };

  const mockRelations: RelationView[] = [
    {
      relationId: "rel_1",
      fromEntityType: "component",
      fromEntityId: "comp_123",
      toEntityType: "component",
      toEntityId: "comp_456",
      relationType: "uses",
      strength: "strong",
      description: "UserService uses AuthProvider",
      status: "active",
      version: 1,
      createdAt: "2025-01-01T10:00:00Z",
      updatedAt: "2025-01-01T10:00:00Z",
    },
  ];

  beforeEach(() => {
    mockComponentReader = {
      findById: jest.fn(),
      findByName: jest.fn(),
    } as jest.Mocked<IComponentReader>;

    mockRelationListReader = {
      findAll: jest.fn(),
    } as jest.Mocked<IRelationListReader>;

    queryHandler = new ShowComponentQueryHandler(
      mockComponentReader,
      mockRelationListReader
    );
  });

  describe("execute", () => {
    it("should find component by ID and return with relations", async () => {
      mockComponentReader.findById.mockResolvedValue(mockComponent);
      mockRelationListReader.findAll.mockResolvedValue(mockRelations);

      const result = await queryHandler.execute({ componentId: "comp_123" });

      expect(result.component).toEqual(mockComponent);
      expect(result.relations).toEqual(mockRelations);
      expect(mockComponentReader.findById).toHaveBeenCalledWith("comp_123");
      expect(mockRelationListReader.findAll).toHaveBeenCalledWith({
        entityType: "component",
        entityId: "comp_123",
        status: "active",
      });
    });

    it("should find component by name and return with relations", async () => {
      mockComponentReader.findByName.mockResolvedValue(mockComponent);
      mockRelationListReader.findAll.mockResolvedValue(mockRelations);

      const result = await queryHandler.execute({ name: "UserService" });

      expect(result.component).toEqual(mockComponent);
      expect(result.relations).toEqual(mockRelations);
      expect(mockComponentReader.findByName).toHaveBeenCalledWith("UserService");
      expect(mockComponentReader.findById).not.toHaveBeenCalled();
    });

    it("should prefer componentId over name when both provided", async () => {
      mockComponentReader.findById.mockResolvedValue(mockComponent);
      mockRelationListReader.findAll.mockResolvedValue([]);

      const result = await queryHandler.execute({
        componentId: "comp_123",
        name: "UserService",
      });

      expect(result.component).toEqual(mockComponent);
      expect(mockComponentReader.findById).toHaveBeenCalledWith("comp_123");
      expect(mockComponentReader.findByName).not.toHaveBeenCalled();
    });

    it("should throw when component not found by ID", async () => {
      mockComponentReader.findById.mockResolvedValue(null);

      await expect(
        queryHandler.execute({ componentId: "comp_nonexistent" })
      ).rejects.toThrow("Component not found: comp_nonexistent");
    });

    it("should throw when component not found by name", async () => {
      mockComponentReader.findByName.mockResolvedValue(null);

      await expect(
        queryHandler.execute({ name: "NonExistent" })
      ).rejects.toThrow("Component not found: NonExistent");
    });

    it("should throw when neither ID nor name provided", async () => {
      await expect(queryHandler.execute({})).rejects.toThrow(
        "Component not found"
      );
    });

    it("should return empty relations when component has none", async () => {
      mockComponentReader.findById.mockResolvedValue(mockComponent);
      mockRelationListReader.findAll.mockResolvedValue([]);

      const result = await queryHandler.execute({ componentId: "comp_123" });

      expect(result.component).toEqual(mockComponent);
      expect(result.relations).toEqual([]);
    });
  });
});
