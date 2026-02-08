/**
 * Tests for ListAudiencePainsQueryHandler
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ListAudiencePainsQueryHandler } from "../../../../src/application/audience-pains/list/ListAudiencePainsQueryHandler.js";
import { IAudiencePainContextReader } from "../../../../src/application/audience-pains/query/IAudiencePainContextReader.js";
import { AudiencePainView } from "../../../../src/application/audience-pains/AudiencePainView.js";

describe("ListAudiencePainsQueryHandler", () => {
  let queryHandler: ListAudiencePainsQueryHandler;
  let mockReader: jest.Mocked<IAudiencePainContextReader>;

  beforeEach(() => {
    mockReader = {
      findAllActive: jest.fn(),
    } as jest.Mocked<IAudiencePainContextReader>;

    queryHandler = new ListAudiencePainsQueryHandler(mockReader);
  });

  describe("execute", () => {
    it("should return all active audience pains", async () => {
      const mockPains: AudiencePainView[] = [
        {
          painId: "pain_123",
          title: "Context Loss",
          description: "LLMs lose context between sessions",
          status: "active",
          resolvedAt: null,
          version: 1,
          createdAt: "2025-01-01T10:00:00Z",
          updatedAt: "2025-01-01T10:00:00Z",
        },
        {
          painId: "pain_456",
          title: "No Memory Transfer",
          description: "Context not transferable across agents",
          status: "active",
          resolvedAt: null,
          version: 1,
          createdAt: "2025-01-01T11:00:00Z",
          updatedAt: "2025-01-01T11:00:00Z",
        },
      ];

      mockReader.findAllActive.mockResolvedValue(mockPains);

      const result = await queryHandler.execute();

      expect(result).toEqual(mockPains);
      expect(result).toHaveLength(2);
      expect(mockReader.findAllActive).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no pains exist", async () => {
      mockReader.findAllActive.mockResolvedValue([]);

      const result = await queryHandler.execute();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockReader.findAllActive).toHaveBeenCalledTimes(1);
    });

    it("should delegate to audiencePainContextReader.findAllActive", async () => {
      mockReader.findAllActive.mockResolvedValue([]);

      await queryHandler.execute();

      expect(mockReader.findAllActive).toHaveBeenCalled();
    });

    it("should preserve ordering from reader", async () => {
      const orderedPains: AudiencePainView[] = [
        {
          painId: "pain_first",
          title: "First Pain",
          description: "Created first",
          status: "active",
          resolvedAt: null,
          version: 1,
          createdAt: "2025-01-01T08:00:00Z",
          updatedAt: "2025-01-01T08:00:00Z",
        },
        {
          painId: "pain_second",
          title: "Second Pain",
          description: "Created second",
          status: "active",
          resolvedAt: null,
          version: 1,
          createdAt: "2025-01-01T09:00:00Z",
          updatedAt: "2025-01-01T09:00:00Z",
        },
      ];

      mockReader.findAllActive.mockResolvedValue(orderedPains);

      const result = await queryHandler.execute();

      expect(result[0].painId).toBe("pain_first");
      expect(result[1].painId).toBe("pain_second");
    });
  });
});
