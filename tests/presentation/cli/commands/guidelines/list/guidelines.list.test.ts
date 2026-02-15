/**
 * Tests for guidelines.list CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { guidelinesList } from "../../../../../../src/presentation/cli/commands/guidelines/list/guidelines.list.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { IGuidelineViewReader } from "../../../../../../src/application/context/guidelines/get/IGuidelineViewReader.js";
import { GuidelineView } from "../../../../../../src/application/context/guidelines/GuidelineView.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("guidelines.list command", () => {
  let mockContainer: Partial<IApplicationContainer>;
  let mockGuidelineViewReader: jest.Mocked<IGuidelineViewReader>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockGuidelineViewReader = {
      findAll: jest.fn(),
    } as jest.Mocked<IGuidelineViewReader>;

    mockContainer = {
      guidelineViewReader: mockGuidelineViewReader,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should list all guidelines by default", async () => {
    const mockGuidelines: GuidelineView[] = [
      {
        guidelineId: "guideline_123",
        category: "testing",
        title: "Write unit tests for all functions",
        description: "Every function should have corresponding unit tests",
        rationale: "Ensures code quality and prevents regressions",
        enforcement: "CI pipeline runs tests on every commit",
        examples: ["src/utils/math.test.ts"],
        isRemoved: false,
        removedAt: null,
        removalReason: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockGuidelineViewReader.findAll.mockResolvedValue(mockGuidelines);

    await guidelinesList({}, mockContainer as IApplicationContainer);

    expect(mockGuidelineViewReader.findAll).toHaveBeenCalledWith(undefined);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should filter by category when specified", async () => {
    mockGuidelineViewReader.findAll.mockResolvedValue([]);

    await guidelinesList({ category: "testing" }, mockContainer as IApplicationContainer);

    expect(mockGuidelineViewReader.findAll).toHaveBeenCalledWith("testing");
  });

  it("should show info message when no guidelines exist", async () => {
    mockGuidelineViewReader.findAll.mockResolvedValue([]);

    await guidelinesList({}, mockContainer as IApplicationContainer);

    expect(mockGuidelineViewReader.findAll).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    const mockGuidelines: GuidelineView[] = [
      {
        guidelineId: "guideline_123",
        category: "codingStyle",
        title: "Use camelCase",
        description: "Variables should use camelCase",
        rationale: "Consistency",
        enforcement: "ESLint",
        examples: [],
        isRemoved: false,
        removedAt: null,
        removalReason: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockGuidelineViewReader.findAll.mockResolvedValue(mockGuidelines);

    await guidelinesList({}, mockContainer as IApplicationContainer);

    expect(mockGuidelineViewReader.findAll).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should filter by codingStyle category", async () => {
    mockGuidelineViewReader.findAll.mockResolvedValue([]);

    await guidelinesList({ category: "codingStyle" }, mockContainer as IApplicationContainer);

    expect(mockGuidelineViewReader.findAll).toHaveBeenCalledWith("codingStyle");
  });

  it("should filter by security category", async () => {
    mockGuidelineViewReader.findAll.mockResolvedValue([]);

    await guidelinesList({ category: "security" }, mockContainer as IApplicationContainer);

    expect(mockGuidelineViewReader.findAll).toHaveBeenCalledWith("security");
  });
});
