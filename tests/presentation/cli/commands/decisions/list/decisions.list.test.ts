/**
 * Tests for decisions.list CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { decisionsList } from "../../../../../../src/presentation/cli/commands/decisions/list/decisions.list.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { IDecisionListReader } from "../../../../../../src/application/context/decisions/list/IDecisionListReader.js";
import { DecisionView } from "../../../../../../src/application/context/decisions/DecisionView.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("decisions.list command", () => {
  let mockContainer: Partial<IApplicationContainer>;
  let mockDecisionListReader: jest.Mocked<IDecisionListReader>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockDecisionListReader = {
      findAll: jest.fn(),
    } as jest.Mocked<IDecisionListReader>;

    mockContainer = {
      decisionListReader: mockDecisionListReader,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should list all decisions by default", async () => {
    const mockDecisions: DecisionView[] = [
      {
        decisionId: "dec_123",
        title: "Use Event Sourcing",
        context: "Need to track all state changes",
        rationale: "Enables full audit trail",
        alternatives: ["CRUD"],
        consequences: null,
        status: "active",
        supersededBy: null,
        reversalReason: null,
        reversedAt: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockDecisionListReader.findAll.mockResolvedValue(mockDecisions);

    await decisionsList({}, mockContainer as IApplicationContainer);

    expect(mockDecisionListReader.findAll).toHaveBeenCalledWith("all");
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should filter by status when specified", async () => {
    mockDecisionListReader.findAll.mockResolvedValue([]);

    await decisionsList({ status: "active" }, mockContainer as IApplicationContainer);

    expect(mockDecisionListReader.findAll).toHaveBeenCalledWith("active");
  });

  it("should show info message when no decisions exist", async () => {
    mockDecisionListReader.findAll.mockResolvedValue([]);

    await decisionsList({}, mockContainer as IApplicationContainer);

    expect(mockDecisionListReader.findAll).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    const mockDecisions: DecisionView[] = [
      {
        decisionId: "dec_123",
        title: "Test Decision",
        context: "Test context",
        rationale: "Test rationale",
        alternatives: [],
        consequences: null,
        status: "active",
        supersededBy: null,
        reversalReason: null,
        reversedAt: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockDecisionListReader.findAll.mockResolvedValue(mockDecisions);

    await decisionsList({}, mockContainer as IApplicationContainer);

    expect(mockDecisionListReader.findAll).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
