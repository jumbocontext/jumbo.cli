import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { DependencyView } from "../../../../../../src/application/context/dependencies/DependencyView.js";
import { IDependencyViewReader } from "../../../../../../src/application/context/dependencies/get/IDependencyViewReader.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { dependenciesSearch, metadata } from "../../../../../../src/presentation/cli/commands/dependencies/search/dependencies.search.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("dependencies.search command", () => {
  let mockReader: jest.Mocked<IDependencyViewReader>;
  let mockContainer: Partial<IApplicationContainer>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;
  let processExitSpy: jest.SpiedFunction<typeof process.exit>;

  const mockDependencies: DependencyView[] = [
    {
      dependencyId: "dep_1",
      name: "Express",
      ecosystem: "npm",
      packageName: "express",
      versionConstraint: "^4.18.0",
      endpoint: null,
      contract: "HTTP server",
      status: "active",
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      removedAt: null,
      removalReason: null,
    },
  ];

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockReader = {
      findAll: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn<IDependencyViewReader["search"]>().mockResolvedValue(mockDependencies),
    };

    mockContainer = {
      dependencyViewReader: mockReader,
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
    expect(metadata.description).toContain("Search dependencies");
    expect(metadata.requiresProject).toBe(true);
    expect(metadata.options?.map(option => option.flags)).toEqual([
      "--name <name>",
      "--ecosystem <ecosystem>",
      "--package-name <packageName>",
      "--version <version>",
      "--status <status>",
      "--consumer <componentId>",
      "--provider <componentId>",
      "-q, --query <query>",
      "-o, --output <output>",
    ]);
    expect(metadata.related).toContain("dependencies list");
  });

  it("should search dependencies with all supported filters", async () => {
    await dependenciesSearch(
      {
        name: "Express",
        ecosystem: "npm",
        packageName: "exp*",
        version: "^4",
        status: "active",
        consumer: "Auth*",
        provider: "*Client",
        query: "server",
        output: "compact",
      },
      mockContainer as IApplicationContainer
    );

    expect(mockReader.search).toHaveBeenCalledWith({
      name: "Express",
      ecosystem: "npm",
      packageName: "exp*",
      versionConstraint: "^4",
      status: "active",
      consumer: "Auth*",
      provider: "*Client",
      query: "server",
    });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    await dependenciesSearch(
      { packageName: "express" },
      mockContainer as IApplicationContainer
    );

    expect(mockReader.search).toHaveBeenCalledWith({
      packageName: "express",
    });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should reject invalid status values", async () => {
    await expect(
      dependenciesSearch({ status: "unknown" }, mockContainer as IApplicationContainer)
    ).rejects.toThrow("process.exit called with code 1");

    expect(mockReader.search).not.toHaveBeenCalled();
  });

  it("should reject invalid output modes", async () => {
    await expect(
      dependenciesSearch({ output: "wide" }, mockContainer as IApplicationContainer)
    ).rejects.toThrow("process.exit called with code 1");

    expect(mockReader.search).not.toHaveBeenCalled();
  });
});
