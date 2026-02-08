/**
 * Tests for audiencePains.list CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { audiencePainsList } from "../../../../../../src/presentation/cli/commands/audience-pains/list/audiencePains.list.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { IAudiencePainContextReader } from "../../../../../../src/application/audience-pains/query/IAudiencePainContextReader.js";
import { AudiencePainView } from "../../../../../../src/application/audience-pains/AudiencePainView.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("audiencePains.list command", () => {
  let mockContainer: Partial<IApplicationContainer>;
  let mockAudiencePainContextReader: jest.Mocked<IAudiencePainContextReader>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockAudiencePainContextReader = {
      findAllActive: jest.fn(),
    } as jest.Mocked<IAudiencePainContextReader>;

    mockContainer = {
      audiencePainContextReader: mockAudiencePainContextReader,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should list pain points in text format", async () => {
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
    ];

    mockAudiencePainContextReader.findAllActive.mockResolvedValue(mockPains);

    await audiencePainsList({} as Record<string, never>, mockContainer as IApplicationContainer);

    expect(mockAudiencePainContextReader.findAllActive).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should show info message when no pains exist", async () => {
    mockAudiencePainContextReader.findAllActive.mockResolvedValue([]);

    await audiencePainsList({} as Record<string, never>, mockContainer as IApplicationContainer);

    expect(mockAudiencePainContextReader.findAllActive).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    const mockPains: AudiencePainView[] = [
      {
        painId: "pain_123",
        title: "Context Loss",
        description: "LLMs lose context",
        status: "active",
        resolvedAt: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockAudiencePainContextReader.findAllActive.mockResolvedValue(mockPains);

    await audiencePainsList({} as Record<string, never>, mockContainer as IApplicationContainer);

    expect(mockAudiencePainContextReader.findAllActive).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should handle multiple pain points", async () => {
    const mockPains: AudiencePainView[] = [
      {
        painId: "pain_1",
        title: "First Pain",
        description: "Description 1",
        status: "active",
        resolvedAt: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
      {
        painId: "pain_2",
        title: "Second Pain",
        description: "Description 2",
        status: "active",
        resolvedAt: null,
        version: 1,
        createdAt: "2025-01-01T11:00:00Z",
        updatedAt: "2025-01-01T11:00:00Z",
      },
    ];

    mockAudiencePainContextReader.findAllActive.mockResolvedValue(mockPains);

    await audiencePainsList({} as Record<string, never>, mockContainer as IApplicationContainer);

    expect(mockAudiencePainContextReader.findAllActive).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
