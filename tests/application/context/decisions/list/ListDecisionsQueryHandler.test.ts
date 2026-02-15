/**
 * Tests for GetDecisionsQueryHandler
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GetDecisionsQueryHandler } from "../../../../../src/application/context/decisions/get/GetDecisionsQueryHandler.js";
import { IDecisionViewReader } from "../../../../../src/application/context/decisions/get/IDecisionViewReader.js";
import { DecisionView } from "../../../../../src/application/context/decisions/DecisionView.js";

describe("GetDecisionsQueryHandler", () => {
  let queryHandler: GetDecisionsQueryHandler;
  let mockReader: jest.Mocked<IDecisionViewReader>;

  beforeEach(() => {
    mockReader = {
      findAll: jest.fn(),
    } as jest.Mocked<IDecisionViewReader>;

    queryHandler = new GetDecisionsQueryHandler(mockReader);
  });

  describe("execute", () => {
    it("should return all decisions when no filter specified", async () => {
      const mockDecisions: DecisionView[] = [
        {
          decisionId: "dec_123",
          title: "Use Event Sourcing",
          context: "Need to track all state changes",
          rationale: "Enables full audit trail",
          alternatives: ["CRUD", "State snapshots"],
          consequences: "More complex implementation",
          status: "active",
          supersededBy: null,
          reversalReason: null,
          reversedAt: null,
          version: 1,
          createdAt: "2025-01-01T10:00:00Z",
          updatedAt: "2025-01-01T10:00:00Z",
        },
        {
          decisionId: "dec_456",
          title: "Old Database Choice",
          context: "Needed a database",
          rationale: "Was fast at the time",
          alternatives: [],
          consequences: null,
          status: "superseded",
          supersededBy: "dec_789",
          reversalReason: null,
          reversedAt: null,
          version: 2,
          createdAt: "2025-01-01T08:00:00Z",
          updatedAt: "2025-01-01T09:00:00Z",
        },
      ];

      mockReader.findAll.mockResolvedValue(mockDecisions);

      const result = await queryHandler.execute();

      expect(result).toEqual(mockDecisions);
      expect(result).toHaveLength(2);
      expect(mockReader.findAll).toHaveBeenCalledWith("all");
    });

    it("should filter by active status", async () => {
      mockReader.findAll.mockResolvedValue([]);

      await queryHandler.execute("active");

      expect(mockReader.findAll).toHaveBeenCalledWith("active");
    });

    it("should filter by superseded status", async () => {
      mockReader.findAll.mockResolvedValue([]);

      await queryHandler.execute("superseded");

      expect(mockReader.findAll).toHaveBeenCalledWith("superseded");
    });

    it("should filter by reversed status", async () => {
      mockReader.findAll.mockResolvedValue([]);

      await queryHandler.execute("reversed");

      expect(mockReader.findAll).toHaveBeenCalledWith("reversed");
    });

    it("should return empty array when no decisions exist", async () => {
      mockReader.findAll.mockResolvedValue([]);

      const result = await queryHandler.execute();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});
