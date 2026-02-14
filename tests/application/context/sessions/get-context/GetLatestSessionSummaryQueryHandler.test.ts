/**
 * Tests for GetLatestSessionSummary query handler
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GetLatestSessionSummaryQueryHandler } from "../../../../../src/application/context/sessions/get-context/GetLatestSessionSummaryQueryHandler.js";
import { ISessionSummaryReader } from "../../../../../src/application/context/sessions/get-context/ISessionSummaryReader.js";
import { SessionSummaryProjection } from "../../../../../src/application/context/sessions/SessionSummaryView.js";

describe("GetLatestSessionSummaryQueryHandler", () => {
  let query: GetLatestSessionSummaryQueryHandler;
  let mockStore: jest.Mocked<ISessionSummaryReader>;

  beforeEach(() => {
    mockStore = {
      findLatest: jest.fn(),
    } as any;

    query = new GetLatestSessionSummaryQueryHandler(mockStore);
  });

  describe("execute", () => {
    it("should return session summary when LATEST exists", async () => {
      const mockSummary: SessionSummaryProjection = {
        sessionId: "LATEST",
        originalSessionId: "session_123",
        focus: "Test session",
        status: "active",
        contextSnapshot: null,
        completedGoals: [
          { goalId: "goal_1", objective: "Complete task 1", status: "completed", createdAt: "2025-01-01T09:00:00Z" },
        ],
        blockersEncountered: [],
        decisions: [],
        goalsStarted: [],
        goalsPaused: [],
        goalsResumed: [],
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T11:00:00Z",
      };

      mockStore.findLatest.mockResolvedValue(mockSummary);

      const result = await query.execute();

      expect(result).toBe(mockSummary);
      expect(mockStore.findLatest).toHaveBeenCalledTimes(1);
    });

    it("should return null when no LATEST exists", async () => {
      mockStore.findLatest.mockResolvedValue(null);

      const result = await query.execute();

      expect(result).toBeNull();
      expect(mockStore.findLatest).toHaveBeenCalledTimes(1);
    });

    it("should delegate to store.findLatest", async () => {
      mockStore.findLatest.mockResolvedValue(null);

      await query.execute();

      expect(mockStore.findLatest).toHaveBeenCalled();
    });
  });
});
