/**
 * Tests for GetInvariantsQueryHandler
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GetInvariantsQueryHandler } from "../../../../../src/application/context/invariants/get/GetInvariantsQueryHandler.js";
import { IInvariantViewReader } from "../../../../../src/application/context/invariants/get/IInvariantViewReader.js";
import { InvariantView } from "../../../../../src/application/context/invariants/InvariantView.js";

describe("GetInvariantsQueryHandler", () => {
  let queryHandler: GetInvariantsQueryHandler;
  let mockReader: jest.Mocked<IInvariantViewReader>;

  beforeEach(() => {
    mockReader = {
      findAll: jest.fn(),
    } as jest.Mocked<IInvariantViewReader>;

    queryHandler = new GetInvariantsQueryHandler(mockReader);
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
