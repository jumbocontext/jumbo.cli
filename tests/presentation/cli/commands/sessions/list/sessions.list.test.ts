/**
 * Tests for sessions.list CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { sessionsList } from "../../../../../../src/presentation/cli/commands/sessions/list/sessions.list.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { ISessionListReader } from "../../../../../../src/application/sessions/list/ISessionListReader.js";
import { SessionView } from "../../../../../../src/application/sessions/SessionView.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("sessions.list command", () => {
  let mockContainer: Partial<IApplicationContainer>;
  let mockSessionListReader: jest.Mocked<ISessionListReader>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockSessionListReader = {
      findAll: jest.fn(),
    } as jest.Mocked<ISessionListReader>;

    mockContainer = {
      sessionListReader: mockSessionListReader,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should list all sessions by default", async () => {
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

    mockSessionListReader.findAll.mockResolvedValue(mockSessions);

    await sessionsList({}, mockContainer as IApplicationContainer);

    expect(mockSessionListReader.findAll).toHaveBeenCalledWith("all");
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should filter by status when specified", async () => {
    mockSessionListReader.findAll.mockResolvedValue([]);

    await sessionsList({ status: "active" }, mockContainer as IApplicationContainer);

    expect(mockSessionListReader.findAll).toHaveBeenCalledWith("active");
  });

  it("should show info message when no sessions exist", async () => {
    mockSessionListReader.findAll.mockResolvedValue([]);

    await sessionsList({}, mockContainer as IApplicationContainer);

    expect(mockSessionListReader.findAll).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    const mockSessions: SessionView[] = [
      {
        sessionId: "session_123",
        focus: "Test",
        status: "ended",
        contextSnapshot: null,
        version: 1,
        startedAt: "2025-01-01T10:00:00Z",
        endedAt: "2025-01-01T11:00:00Z",
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T11:00:00Z",
      },
    ];

    mockSessionListReader.findAll.mockResolvedValue(mockSessions);

    await sessionsList({}, mockContainer as IApplicationContainer);

    expect(mockSessionListReader.findAll).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
