/**
 * Tests for audiences.list CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { audiencesList } from "../../../../../../src/presentation/cli/commands/audiences/list/audiences.list.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { IAudienceContextReader } from "../../../../../../src/application/context/audiences/query/IAudienceContextReader.js";
import { AudienceView } from "../../../../../../src/application/context/audiences/AudienceView.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("audiences.list command", () => {
  let mockContainer: Partial<IApplicationContainer>;
  let mockAudienceContextReader: jest.Mocked<IAudienceContextReader>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockAudienceContextReader = {
      findAllActive: jest.fn(),
    } as jest.Mocked<IAudienceContextReader>;

    mockContainer = {
      audienceContextReader: mockAudienceContextReader,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should list audiences in text format", async () => {
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
    ];

    mockAudienceContextReader.findAllActive.mockResolvedValue(mockAudiences);

    await audiencesList({} as Record<string, never>, mockContainer as IApplicationContainer);

    expect(mockAudienceContextReader.findAllActive).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should show info message when no audiences exist", async () => {
    mockAudienceContextReader.findAllActive.mockResolvedValue([]);

    await audiencesList({} as Record<string, never>, mockContainer as IApplicationContainer);

    expect(mockAudienceContextReader.findAllActive).toHaveBeenCalledTimes(1);
    // The info message should be rendered
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    const mockAudiences: AudienceView[] = [
      {
        audienceId: "audience_123",
        name: "Software Developers",
        description: "Professional developers",
        priority: "primary",
        isRemoved: false,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockAudienceContextReader.findAllActive.mockResolvedValue(mockAudiences);

    await audiencesList({} as Record<string, never>, mockContainer as IApplicationContainer);

    expect(mockAudienceContextReader.findAllActive).toHaveBeenCalledTimes(1);
    // JSON output should be rendered via renderer.data()
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should handle multiple audiences", async () => {
    const mockAudiences: AudienceView[] = [
      {
        audienceId: "audience_1",
        name: "Primary Users",
        description: "Main target users",
        priority: "primary",
        isRemoved: false,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
      {
        audienceId: "audience_2",
        name: "Secondary Users",
        description: "Secondary target users",
        priority: "secondary",
        isRemoved: false,
        version: 1,
        createdAt: "2025-01-01T11:00:00Z",
        updatedAt: "2025-01-01T11:00:00Z",
      },
      {
        audienceId: "audience_3",
        name: "Tertiary Users",
        description: "Tertiary target users",
        priority: "tertiary",
        isRemoved: false,
        version: 1,
        createdAt: "2025-01-01T12:00:00Z",
        updatedAt: "2025-01-01T12:00:00Z",
      },
    ];

    mockAudienceContextReader.findAllActive.mockResolvedValue(mockAudiences);

    await audiencesList({} as Record<string, never>, mockContainer as IApplicationContainer);

    expect(mockAudienceContextReader.findAllActive).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
