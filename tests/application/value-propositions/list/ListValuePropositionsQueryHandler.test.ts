/**
 * Tests for ListValuePropositionsQueryHandler
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ListValuePropositionsQueryHandler } from "../../../../src/application/value-propositions/list/ListValuePropositionsQueryHandler.js";
import { IValuePropositionContextReader } from "../../../../src/application/value-propositions/query/IValuePropositionContextReader.js";
import { ValuePropositionView } from "../../../../src/application/value-propositions/ValuePropositionView.js";

describe("ListValuePropositionsQueryHandler", () => {
  let queryHandler: ListValuePropositionsQueryHandler;
  let mockReader: jest.Mocked<IValuePropositionContextReader>;

  beforeEach(() => {
    mockReader = {
      findAllActive: jest.fn(),
    } as jest.Mocked<IValuePropositionContextReader>;

    queryHandler = new ListValuePropositionsQueryHandler(mockReader);
  });

  describe("execute", () => {
    it("should return all value propositions", async () => {
      const mockValues: ValuePropositionView[] = [
        {
          valuePropositionId: "value_123",
          title: "Persistent Context",
          description: "Context that persists across sessions",
          benefit: "Never lose context again",
          measurableOutcome: "100% context retention",
          version: 1,
          createdAt: "2025-01-01T10:00:00Z",
          updatedAt: "2025-01-01T10:00:00Z",
        },
        {
          valuePropositionId: "value_456",
          title: "Transferable Memory",
          description: "Memory that transfers across agents",
          benefit: "Switch agents without losing context",
          measurableOutcome: null,
          version: 1,
          createdAt: "2025-01-01T11:00:00Z",
          updatedAt: "2025-01-01T11:00:00Z",
        },
      ];

      mockReader.findAllActive.mockResolvedValue(mockValues);

      const result = await queryHandler.execute();

      expect(result).toEqual(mockValues);
      expect(result).toHaveLength(2);
      expect(mockReader.findAllActive).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no values exist", async () => {
      mockReader.findAllActive.mockResolvedValue([]);

      const result = await queryHandler.execute();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockReader.findAllActive).toHaveBeenCalledTimes(1);
    });

    it("should delegate to valuePropositionContextReader.findAllActive", async () => {
      mockReader.findAllActive.mockResolvedValue([]);

      await queryHandler.execute();

      expect(mockReader.findAllActive).toHaveBeenCalled();
    });
  });
});
