import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalGetRelationsGateway } from "../../../../../src/application/context/relations/get/LocalGetRelationsGateway.js";
import { IRelationViewReader } from "../../../../../src/application/context/relations/get/IRelationViewReader.js";
import { RelationView } from "../../../../../src/application/context/relations/RelationView.js";

describe("LocalGetRelationsGateway", () => {
  let gateway: LocalGetRelationsGateway;
  let mockReader: jest.Mocked<IRelationViewReader>;

  beforeEach(() => {
    mockReader = {
      findAll: jest.fn(),
    } as jest.Mocked<IRelationViewReader>;

    gateway = new LocalGetRelationsGateway(mockReader);
  });

  it("should return relations from the view reader", async () => {
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
    ];

    mockReader.findAll.mockResolvedValue(mockRelations);

    const response = await gateway.getRelations({ status: "active" });

    expect(response.relations).toEqual(mockRelations);
    expect(mockReader.findAll).toHaveBeenCalledWith({
      entityType: undefined,
      entityId: undefined,
      status: "active",
    });
  });

  it("should pass entity filter to the view reader", async () => {
    mockReader.findAll.mockResolvedValue([]);

    await gateway.getRelations({ entityType: "goal", entityId: "goal_123", status: "all" });

    expect(mockReader.findAll).toHaveBeenCalledWith({
      entityType: "goal",
      entityId: "goal_123",
      status: "all",
    });
  });

  it("should return empty relations array when none exist", async () => {
    mockReader.findAll.mockResolvedValue([]);

    const response = await gateway.getRelations({ status: "all" });

    expect(response.relations).toEqual([]);
  });
});
