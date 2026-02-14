/**
 * Tests for values.list CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { valuesList } from "../../../../../../src/presentation/cli/commands/value-propositions/list/values.list.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { IValuePropositionContextReader } from "../../../../../../src/application/context/value-propositions/query/IValuePropositionContextReader.js";
import { ValuePropositionView } from "../../../../../../src/application/context/value-propositions/ValuePropositionView.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("values.list command", () => {
  let mockContainer: Partial<IApplicationContainer>;
  let mockValuePropositionContextReader: jest.Mocked<IValuePropositionContextReader>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockValuePropositionContextReader = {
      findAllActive: jest.fn(),
    } as jest.Mocked<IValuePropositionContextReader>;

    mockContainer = {
      valuePropositionContextReader: mockValuePropositionContextReader,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should list value propositions in text format", async () => {
    const mockValues: ValuePropositionView[] = [
      {
        valuePropositionId: "value_123",
        title: "Persistent Context",
        description: "Context that persists",
        benefit: "Never lose context",
        measurableOutcome: "100% retention",
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockValuePropositionContextReader.findAllActive.mockResolvedValue(mockValues);

    await valuesList({} as Record<string, never>, mockContainer as IApplicationContainer);

    expect(mockValuePropositionContextReader.findAllActive).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should show info message when no values exist", async () => {
    mockValuePropositionContextReader.findAllActive.mockResolvedValue([]);

    await valuesList({} as Record<string, never>, mockContainer as IApplicationContainer);

    expect(mockValuePropositionContextReader.findAllActive).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    const mockValues: ValuePropositionView[] = [
      {
        valuePropositionId: "value_123",
        title: "Persistent Context",
        description: "Context that persists",
        benefit: "Never lose context",
        measurableOutcome: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockValuePropositionContextReader.findAllActive.mockResolvedValue(mockValues);

    await valuesList({} as Record<string, never>, mockContainer as IApplicationContainer);

    expect(mockValuePropositionContextReader.findAllActive).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
