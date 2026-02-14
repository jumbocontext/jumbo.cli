/**
 * Tests for relations.list CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { relationsList } from "../../../../../../src/presentation/cli/commands/relations/list/relations.list.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { IRelationListReader } from "../../../../../../src/application/context/relations/list/IRelationListReader.js";
import { RelationView } from "../../../../../../src/application/context/relations/RelationView.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("relations.list command", () => {
  let mockContainer: Partial<IApplicationContainer>;
  let mockRelationListReader: jest.Mocked<IRelationListReader>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockRelationListReader = {
      findAll: jest.fn(),
    } as jest.Mocked<IRelationListReader>;

    mockContainer = {
      relationListReader: mockRelationListReader,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should list all relations by default", async () => {
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

    mockRelationListReader.findAll.mockResolvedValue(mockRelations);

    await relationsList({}, mockContainer as IApplicationContainer);

    expect(mockRelationListReader.findAll).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should filter by entity type when specified", async () => {
    mockRelationListReader.findAll.mockResolvedValue([]);

    await relationsList({ entityType: "goal" }, mockContainer as IApplicationContainer);

    expect(mockRelationListReader.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: "goal" })
    );
  });

  it("should filter by entity type and id when both specified", async () => {
    mockRelationListReader.findAll.mockResolvedValue([]);

    await relationsList(
      { entityType: "component", entityId: "comp_123" },
      mockContainer as IApplicationContainer
    );

    expect(mockRelationListReader.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: "component", entityId: "comp_123" })
    );
  });

  it("should show info message when no relations exist", async () => {
    mockRelationListReader.findAll.mockResolvedValue([]);

    await relationsList({}, mockContainer as IApplicationContainer);

    expect(mockRelationListReader.findAll).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    const mockRelations: RelationView[] = [
      {
        relationId: "rel_123",
        fromEntityType: "goal",
        fromEntityId: "goal_456",
        toEntityType: "decision",
        toEntityId: "dec_789",
        relationType: "requires",
        strength: null,
        description: "Test relation",
        status: "active",
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockRelationListReader.findAll.mockResolvedValue(mockRelations);

    await relationsList({}, mockContainer as IApplicationContainer);

    expect(mockRelationListReader.findAll).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should filter by status when specified", async () => {
    mockRelationListReader.findAll.mockResolvedValue([]);

    await relationsList({ status: "all" }, mockContainer as IApplicationContainer);

    expect(mockRelationListReader.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ status: "all" })
    );
  });
});
