/**
 * Tests for GetSessionsQueryHandler
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GetSessionsQueryHandler } from "../../../../../src/application/context/sessions/get/GetSessionsQueryHandler.js";
import { ISessionViewReader } from "../../../../../src/application/context/sessions/get/ISessionViewReader.js";
import { SessionView } from "../../../../../src/application/context/sessions/SessionView.js";

describe("GetSessionsQueryHandler", () => {
  let queryHandler: GetSessionsQueryHandler;
  let mockReader: jest.Mocked<ISessionViewReader>;

  beforeEach(() => {
    mockReader = {
      findAll: jest.fn(),
      findActive: jest.fn(),
    } as jest.Mocked<ISessionViewReader>;

    queryHandler = new GetSessionsQueryHandler(mockReader);
  });

  describe("execute", () => {
    it("should return all sessions when no filter specified", async () => {
      const mockSessions: SessionView[] = [
        {
          sessionId: "session_123",
          focus: "Feature development",
          status: "active",
          contextSnapshot: null,
          version: 1,
          startedAt: "2025-01-01T10:00:00Z",
          endedAt: null,
          createdAt: "2025-01-01T10:00:00Z",
          updatedAt: "2025-01-01T10:00:00Z",
        },
        {
          sessionId: "session_456",
          focus: "Bug fixing",
          status: "ended",
          contextSnapshot: null,
          version: 2,
          startedAt: "2025-01-01T08:00:00Z",
          endedAt: "2025-01-01T09:00:00Z",
          createdAt: "2025-01-01T08:00:00Z",
          updatedAt: "2025-01-01T09:00:00Z",
        },
      ];

      mockReader.findAll.mockResolvedValue(mockSessions);

      const result = await queryHandler.execute();

      expect(result).toEqual(mockSessions);
      expect(result).toHaveLength(2);
      expect(mockReader.findAll).toHaveBeenCalledWith("all");
    });

    it("should filter by active status", async () => {
      const mockSessions: SessionView[] = [
        {
          sessionId: "session_123",
          focus: "Feature development",
          status: "active",
          contextSnapshot: null,
          version: 1,
          startedAt: "2025-01-01T10:00:00Z",
          endedAt: null,
          createdAt: "2025-01-01T10:00:00Z",
          updatedAt: "2025-01-01T10:00:00Z",
        },
      ];

      mockReader.findAll.mockResolvedValue(mockSessions);

      const result = await queryHandler.execute("active");

      expect(result).toEqual(mockSessions);
      expect(mockReader.findAll).toHaveBeenCalledWith("active");
    });

    it("should filter by ended status", async () => {
      mockReader.findAll.mockResolvedValue([]);

      await queryHandler.execute("ended");

      expect(mockReader.findAll).toHaveBeenCalledWith("ended");
    });

    it("should filter by paused status", async () => {
      mockReader.findAll.mockResolvedValue([]);

      await queryHandler.execute("paused");

      expect(mockReader.findAll).toHaveBeenCalledWith("paused");
    });

    it("should return empty array when no sessions exist", async () => {
      mockReader.findAll.mockResolvedValue([]);

      const result = await queryHandler.execute();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});
