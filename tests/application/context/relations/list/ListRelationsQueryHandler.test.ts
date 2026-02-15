/**
 * Tests for GetRelationsQueryHandler
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GetRelationsQueryHandler } from "../../../../../src/application/context/relations/get/GetRelationsQueryHandler.js";
import { IRelationViewReader } from "../../../../../src/application/context/relations/get/IRelationViewReader.js";
import { RelationView } from "../../../../../src/application/context/relations/RelationView.js";

describe("GetRelationsQueryHandler", () => {
  let queryHandler: GetRelationsQueryHandler;
  let mockReader: jest.Mocked<IRelationViewReader>;

  beforeEach(() => {
    mockReader = {
      findAll: jest.fn(),
    } as jest.Mocked<IRelationViewReader>;

    queryHandler = new GetRelationsQueryHandler(mockReader);
  });

  describe("execute", () => {
    it("should return all relations when no filter specified", async () => {
      const mockRelations: RelationView[] = [
        {
          relationId: "rel_123",
          fromEntityType: "goal",
          fromEntityId: "goal_456",
          toEntityType: "decision",
          toEntityId: "dec_789",
          relationType: "requires",
          strength: "strong",
          description: "Goal requires this decision",
          status: "active",
          version: 1,
          createdAt: "2025-01-01T10:00:00Z",
          updatedAt: "2025-01-01T10:00:00Z",
        },
        {
          relationId: "rel_456",
          fromEntityType: "component",
          fromEntityId: "comp_123",
          toEntityType: "dependency",
          toEntityId: "dep_456",
          relationType: "uses",
          strength: null,
          description: "Component uses dependency",
          status: "active",
          version: 1,
          createdAt: "2025-01-01T08:00:00Z",
          updatedAt: "2025-01-01T08:00:00Z",
        },
      ];

      mockReader.findAll.mockResolvedValue(mockRelations);

      const result = await queryHandler.execute();

      expect(result).toEqual(mockRelations);
      expect(result).toHaveLength(2);
      expect(mockReader.findAll).toHaveBeenCalledWith(undefined);
    });

    it("should filter by entity type", async () => {
      mockReader.findAll.mockResolvedValue([]);

      await queryHandler.execute({ entityType: "goal" });

      expect(mockReader.findAll).toHaveBeenCalledWith({ entityType: "goal" });
    });

    it("should filter by entity type and id", async () => {
      mockReader.findAll.mockResolvedValue([]);

      await queryHandler.execute({ entityType: "component", entityId: "comp_123" });

      expect(mockReader.findAll).toHaveBeenCalledWith({ entityType: "component", entityId: "comp_123" });
    });

    it("should filter by status", async () => {
      mockReader.findAll.mockResolvedValue([]);

      await queryHandler.execute({ status: "all" });

      expect(mockReader.findAll).toHaveBeenCalledWith({ status: "all" });
    });

    it("should return empty array when no relations exist", async () => {
      mockReader.findAll.mockResolvedValue([]);

      const result = await queryHandler.execute();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});
