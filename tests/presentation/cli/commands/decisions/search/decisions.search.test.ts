import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { DecisionView } from "../../../../../../src/application/context/decisions/DecisionView.js";
import { SearchDecisionsController } from "../../../../../../src/application/context/decisions/search/SearchDecisionsController.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { decisionsSearch, metadata } from "../../../../../../src/presentation/cli/commands/decisions/search/decisions.search.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("decisions.search command", () => {
  let mockController: jest.Mocked<SearchDecisionsController>;
  let mockContainer: Partial<IApplicationContainer>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;
  let processExitSpy: jest.SpiedFunction<typeof process.exit>;

  const mockDecisions: DecisionView[] = [
    {
      decisionId: "dec_1",
      title: "Use Event Sourcing",
      context: "Need durable history",
      rationale: "Provides auditability",
      alternatives: ["CRUD"],
      consequences: null,
      status: "active",
      supersededBy: null,
      reversalReason: null,
      reversedAt: null,
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    },
  ];

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockController = {
      handle: jest.fn<SearchDecisionsController["handle"]>().mockResolvedValue({ decisions: mockDecisions }),
    } as unknown as jest.Mocked<SearchDecisionsController>;

    mockContainer = {
      searchDecisionsController: mockController,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, "exit").mockImplementation(((code?: string | number | null) => {
      throw new Error(`process.exit called with code ${code}`);
    }) as typeof process.exit);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    processExitSpy.mockRestore();
    Renderer.reset();
  });

  it("should declare project-scoped command metadata", () => {
    expect(metadata.description).toContain("Search architectural decisions");
    expect(metadata.requiresProject).toBe(true);
    expect(metadata.options?.map(option => option.flags)).toEqual([
      "-t, --title <title>",
      "-s, --status <status>",
      "-q, --query <query>",
      "-o, --output <output>",
    ]);
    expect(metadata.related).toContain("decisions list");
  });

  it("should search decisions with status, title, and query filters", async () => {
    await decisionsSearch(
      { status: "active", title: "Event*", query: "audit", output: "compact" },
      mockContainer as IApplicationContainer
    );

    expect(mockController.handle).toHaveBeenCalledWith({
      criteria: {
        status: "active",
        title: "Event*",
        query: "audit",
      },
    });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should default omitted status to all", async () => {
    await decisionsSearch(
      { title: "Event" },
      mockContainer as IApplicationContainer
    );

    expect(mockController.handle).toHaveBeenCalledWith({
      criteria: {
        status: "all",
        title: "Event",
      },
    });
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    await decisionsSearch(
      { title: "Event" },
      mockContainer as IApplicationContainer
    );

    expect(mockController.handle).toHaveBeenCalledWith({
      criteria: {
        status: "all",
        title: "Event",
      },
    });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should reject invalid status values", async () => {
    await expect(
      decisionsSearch({ status: "deprecated" }, mockContainer as IApplicationContainer)
    ).rejects.toThrow("process.exit called with code 1");

    expect(mockController.handle).not.toHaveBeenCalled();
  });
});
