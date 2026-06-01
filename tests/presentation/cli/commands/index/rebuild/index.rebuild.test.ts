import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { SearchIndexRebuildResponse } from "../../../../../../src/application/context/search/SearchIndexRebuildResponse.js";
import { SearchCategory } from "../../../../../../src/application/context/search/SearchCategory.js";
import { SearchIndexRebuildController } from "../../../../../../src/application/context/search/SearchIndexRebuildController.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { indexRebuild, metadata } from "../../../../../../src/presentation/cli/commands/index/rebuild/index.rebuild.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("index rebuild command", () => {
  let mockContainer: IApplicationContainer;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let handleSpy: jest.SpiedFunction<SearchIndexRebuildController["handle"]>;

  const response: SearchIndexRebuildResponse = {
    success: true,
    eventsInspected: 4,
    documentsIndexed: 2,
    removedEntries: 1,
    countsByCategory: { [SearchCategory.COMPONENT]: 2 },
  };

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });
    mockContainer = {
      eventStore: {},
      searchIndexReader: {},
      searchIndexWriter: {},
    } as IApplicationContainer;
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    handleSpy = jest.spyOn(SearchIndexRebuildController.prototype, "handle").mockResolvedValue(response);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    Renderer.reset();
    jest.restoreAllMocks();
  });

  it("declares project-scoped rebuild metadata without unsupported options", () => {
    expect(metadata.description).toContain("Rebuild");
    expect(metadata.requiresProject).toBe(true);
    expect(metadata.options).toBeUndefined();
    expect(metadata.requiredOptions).toBeUndefined();
    expect(metadata.examples?.some((example) => example.command === "jumbo index rebuild --format json")).toBe(true);
    expect(metadata.related).toEqual(expect.arrayContaining(["search", "heal"]));
  });

  it("builds an empty typed rebuild request and renders text output", async () => {
    await indexRebuild({}, mockContainer);

    expect(handleSpy).toHaveBeenCalledWith({});
    expect(consoleLogSpy).toHaveBeenCalled();
    expect(consoleLogSpy.mock.calls[0][0]).toContain("Search Index Rebuild");
  });

  it("outputs one JSON object when configured for structured output", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    await indexRebuild({}, mockContainer);

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(parsed).toEqual({
      success: true,
      eventsInspected: 4,
      documentsIndexed: 2,
      removedEntries: 1,
      countsByCategory: { [SearchCategory.COMPONENT]: 2 },
    });
  });

  it("reports rebuild failures to stderr without structured stdout", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });
    handleSpy.mockRejectedValue(new Error("rebuild failed"));
    const processExitSpy = jest.spyOn(process, "exit").mockImplementation(((code?: string | number | null) => {
      throw new Error(`process.exit called with code ${code}`);
    }) as typeof process.exit);

    await expect(indexRebuild({}, mockContainer)).rejects.toThrow("process.exit called with code 1");

    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(consoleErrorSpy.mock.calls[0][0] as string)).toEqual({
      error: "Search index rebuild failed",
      details: "rebuild failed",
    });
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
