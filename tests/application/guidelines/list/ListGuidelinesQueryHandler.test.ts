/**
 * Tests for ListGuidelinesQueryHandler
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ListGuidelinesQueryHandler } from "../../../../src/application/guidelines/list/ListGuidelinesQueryHandler.js";
import { IGuidelineListReader } from "../../../../src/application/guidelines/list/IGuidelineListReader.js";
import { GuidelineView } from "../../../../src/application/guidelines/GuidelineView.js";

describe("ListGuidelinesQueryHandler", () => {
  let queryHandler: ListGuidelinesQueryHandler;
  let mockReader: jest.Mocked<IGuidelineListReader>;

  beforeEach(() => {
    mockReader = {
      findAll: jest.fn(),
    } as jest.Mocked<IGuidelineListReader>;

    queryHandler = new ListGuidelinesQueryHandler(mockReader);
  });

  describe("execute", () => {
    it("should return all guidelines when no category filter specified", async () => {
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
        {
          guidelineId: "guideline_456",
          category: "codingStyle",
          title: "Use camelCase for variable names",
          description: "All variable names should follow camelCase convention",
          rationale: "Consistency across the codebase",
          enforcement: "ESLint rules configured",
          examples: [],
          isRemoved: false,
          removedAt: null,
          removalReason: null,
          version: 1,
          createdAt: "2025-01-01T08:00:00Z",
          updatedAt: "2025-01-01T08:00:00Z",
        },
      ];

      mockReader.findAll.mockResolvedValue(mockGuidelines);

      const result = await queryHandler.execute();

      expect(result).toEqual(mockGuidelines);
      expect(result).toHaveLength(2);
      expect(mockReader.findAll).toHaveBeenCalledWith(undefined);
    });

    it("should filter by testing category", async () => {
      mockReader.findAll.mockResolvedValue([]);

      await queryHandler.execute("testing");

      expect(mockReader.findAll).toHaveBeenCalledWith("testing");
    });

    it("should filter by codingStyle category", async () => {
      mockReader.findAll.mockResolvedValue([]);

      await queryHandler.execute("codingStyle");

      expect(mockReader.findAll).toHaveBeenCalledWith("codingStyle");
    });

    it("should filter by process category", async () => {
      mockReader.findAll.mockResolvedValue([]);

      await queryHandler.execute("process");

      expect(mockReader.findAll).toHaveBeenCalledWith("process");
    });

    it("should filter by security category", async () => {
      mockReader.findAll.mockResolvedValue([]);

      await queryHandler.execute("security");

      expect(mockReader.findAll).toHaveBeenCalledWith("security");
    });

    it("should return empty array when no guidelines exist", async () => {
      mockReader.findAll.mockResolvedValue([]);

      const result = await queryHandler.execute();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});
