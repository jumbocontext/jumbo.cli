/**
 * Tests for ListInvariantsQueryHandler
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ListInvariantsQueryHandler } from "../../../../src/application/invariants/list/ListInvariantsQueryHandler.js";
import { IInvariantListReader } from "../../../../src/application/invariants/list/IInvariantListReader.js";
import { InvariantView } from "../../../../src/application/invariants/InvariantView.js";

describe("ListInvariantsQueryHandler", () => {
  let queryHandler: ListInvariantsQueryHandler;
  let mockReader: jest.Mocked<IInvariantListReader>;

  beforeEach(() => {
    mockReader = {
      findAll: jest.fn(),
    } as jest.Mocked<IInvariantListReader>;

    queryHandler = new ListInvariantsQueryHandler(mockReader);
  });

  describe("execute", () => {
    it("should return all invariants", async () => {
      const mockInvariants: InvariantView[] = [
        {
          invariantId: "inv_123",
          title: "Single Responsibility",
          description: "Each class/module has one reason to change",
          rationale: "Reduces coupling and improves maintainability",
          enforcement: "Code review checklist",
          version: 1,
          createdAt: "2025-01-01T10:00:00Z",
          updatedAt: "2025-01-01T10:00:00Z",
        },
        {
          invariantId: "inv_456",
          title: "No Junk Drawers",
          description: "No utils/, services/, managers/ catch-alls",
          rationale: "Code should be organized by domain concept",
          enforcement: "Linting rules",
          version: 1,
          createdAt: "2025-01-01T08:00:00Z",
          updatedAt: "2025-01-01T08:00:00Z",
        },
      ];

      mockReader.findAll.mockResolvedValue(mockInvariants);

      const result = await queryHandler.execute();

      expect(result).toEqual(mockInvariants);
      expect(result).toHaveLength(2);
      expect(mockReader.findAll).toHaveBeenCalled();
    });

    it("should return empty array when no invariants exist", async () => {
      mockReader.findAll.mockResolvedValue([]);

      const result = await queryHandler.execute();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});
