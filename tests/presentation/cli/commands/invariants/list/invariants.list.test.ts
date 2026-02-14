/**
 * Tests for invariants.list CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { invariantsList } from "../../../../../../src/presentation/cli/commands/invariants/list/invariants.list.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { IInvariantListReader } from "../../../../../../src/application/context/invariants/list/IInvariantListReader.js";
import { InvariantView } from "../../../../../../src/application/context/invariants/InvariantView.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("invariants.list command", () => {
  let mockContainer: Partial<IApplicationContainer>;
  let mockInvariantListReader: jest.Mocked<IInvariantListReader>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockInvariantListReader = {
      findAll: jest.fn(),
    } as jest.Mocked<IInvariantListReader>;

    mockContainer = {
      invariantListReader: mockInvariantListReader,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should list all invariants", async () => {
    const mockInvariants: InvariantView[] = [
      {
        invariantId: "inv_123",
        title: "Single Responsibility",
        description: "Each class/module has one reason to change",
        rationale: "Reduces coupling",
        enforcement: "Code review",
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockInvariantListReader.findAll.mockResolvedValue(mockInvariants);

    await invariantsList({}, mockContainer as IApplicationContainer);

    expect(mockInvariantListReader.findAll).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should show info message when no invariants exist", async () => {
    mockInvariantListReader.findAll.mockResolvedValue([]);

    await invariantsList({}, mockContainer as IApplicationContainer);

    expect(mockInvariantListReader.findAll).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    const mockInvariants: InvariantView[] = [
      {
        invariantId: "inv_123",
        title: "Test Invariant",
        description: "Test description",
        rationale: "Test rationale",
        enforcement: "Test enforcement",
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockInvariantListReader.findAll.mockResolvedValue(mockInvariants);

    await invariantsList({}, mockContainer as IApplicationContainer);

    expect(mockInvariantListReader.findAll).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
