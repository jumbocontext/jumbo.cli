import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { IInvariantViewReader } from "../../../../../../src/application/context/invariants/get/IInvariantViewReader.js";
import { InvariantView } from "../../../../../../src/application/context/invariants/InvariantView.js";
import { invariantsSearch, metadata } from "../../../../../../src/presentation/cli/commands/invariants/search/invariants.search.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("invariants.search command", () => {
  let mockReader: jest.Mocked<IInvariantViewReader>;
  let mockContainer: Partial<IApplicationContainer>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  const mockInvariants: InvariantView[] = [
    {
      invariantId: "inv_1",
      title: "Clean Architecture",
      description: "Keep layer boundaries clear",
      rationale: "Reduces coupling",
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    },
  ];

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockReader = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findAll: jest.fn(),
      search: jest.fn<IInvariantViewReader["search"]>().mockResolvedValue(mockInvariants),
    };

    mockContainer = {
      invariantViewReader: mockReader,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should declare project-scoped command metadata", () => {
    expect(metadata.description).toContain("Search invariants");
    expect(metadata.requiresProject).toBe(true);
    expect(metadata.options?.map(option => option.flags)).toEqual([
      "-t, --title <title>",
      "-q, --query <query>",
      "-o, --output <output>",
    ]);
    expect(metadata.related).toContain("invariants list");
  });

  it("should search invariants with title and query filters", async () => {
    await invariantsSearch(
      { title: "Clean*", query: "coupling", output: "compact" },
      mockContainer as IApplicationContainer
    );

    expect(mockReader.search).toHaveBeenCalledWith({
      title: "Clean*",
      query: "coupling",
    });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    await invariantsSearch(
      { title: "Clean" },
      mockContainer as IApplicationContainer
    );

    expect(mockReader.search).toHaveBeenCalledWith({ title: "Clean" });
    expect(consoleSpy).toHaveBeenCalled();
  });
});
