/**
 * Tests for ListAudiencesQueryHandler
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ListAudiencesQueryHandler } from "../../../../../src/application/context/audiences/list/ListAudiencesQueryHandler.js";
import { IAudienceContextReader } from "../../../../../src/application/context/audiences/query/IAudienceContextReader.js";
import { AudienceView } from "../../../../../src/application/context/audiences/AudienceView.js";

describe("ListAudiencesQueryHandler", () => {
  let queryHandler: ListAudiencesQueryHandler;
  let mockReader: jest.Mocked<IAudienceContextReader>;

  beforeEach(() => {
    mockReader = {
      findAllActive: jest.fn(),
    } as jest.Mocked<IAudienceContextReader>;

    queryHandler = new ListAudiencesQueryHandler(mockReader);
  });

  describe("execute", () => {
    it("should return all active audiences", async () => {
      const mockAudiences: AudienceView[] = [
        {
          audienceId: "audience_123",
          name: "Software Developers",
          description: "Professional developers building applications",
          priority: "primary",
          isRemoved: false,
          version: 1,
          createdAt: "2025-01-01T10:00:00Z",
          updatedAt: "2025-01-01T10:00:00Z",
        },
        {
          audienceId: "audience_456",
          name: "DevOps Engineers",
          description: "Engineers managing infrastructure",
          priority: "secondary",
          isRemoved: false,
          version: 1,
          createdAt: "2025-01-01T11:00:00Z",
          updatedAt: "2025-01-01T11:00:00Z",
        },
      ];

      mockReader.findAllActive.mockResolvedValue(mockAudiences);

      const result = await queryHandler.execute();

      expect(result).toEqual(mockAudiences);
      expect(result).toHaveLength(2);
      expect(mockReader.findAllActive).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no audiences exist", async () => {
      mockReader.findAllActive.mockResolvedValue([]);

      const result = await queryHandler.execute();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockReader.findAllActive).toHaveBeenCalledTimes(1);
    });

    it("should delegate to audienceContextReader.findAllActive", async () => {
      mockReader.findAllActive.mockResolvedValue([]);

      await queryHandler.execute();

      expect(mockReader.findAllActive).toHaveBeenCalled();
    });

    it("should preserve audience ordering from reader", async () => {
      const orderedAudiences: AudienceView[] = [
        {
          audienceId: "audience_primary",
          name: "Primary Audience",
          description: "First priority",
          priority: "primary",
          isRemoved: false,
          version: 1,
          createdAt: "2025-01-01T10:00:00Z",
          updatedAt: "2025-01-01T10:00:00Z",
        },
        {
          audienceId: "audience_secondary",
          name: "Secondary Audience",
          description: "Second priority",
          priority: "secondary",
          isRemoved: false,
          version: 1,
          createdAt: "2025-01-01T09:00:00Z",
          updatedAt: "2025-01-01T09:00:00Z",
        },
        {
          audienceId: "audience_tertiary",
          name: "Tertiary Audience",
          description: "Third priority",
          priority: "tertiary",
          isRemoved: false,
          version: 1,
          createdAt: "2025-01-01T08:00:00Z",
          updatedAt: "2025-01-01T08:00:00Z",
        },
      ];

      mockReader.findAllActive.mockResolvedValue(orderedAudiences);

      const result = await queryHandler.execute();

      expect(result[0].priority).toBe("primary");
      expect(result[1].priority).toBe("secondary");
      expect(result[2].priority).toBe("tertiary");
    });
  });
});
