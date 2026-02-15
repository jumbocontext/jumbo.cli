/**
 * Tests for components.list CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { componentsList } from "../../../../../../src/presentation/cli/commands/components/list/components.list.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { IComponentViewReader } from "../../../../../../src/application/context/components/get/IComponentViewReader.js";
import { ComponentView } from "../../../../../../src/application/context/components/ComponentView.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("components.list command", () => {
  let mockContainer: Partial<IApplicationContainer>;
  let mockComponentViewReader: jest.Mocked<IComponentViewReader>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockComponentViewReader = {
      findAll: jest.fn(),
    } as jest.Mocked<IComponentViewReader>;

    mockContainer = {
      componentViewReader: mockComponentViewReader,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should list all components by default", async () => {
    const mockComponents: ComponentView[] = [
      {
        componentId: "comp_123",
        name: "UserService",
        type: "service",
        description: "Handles user operations",
        responsibility: "User management",
        path: "src/services/user",
        status: "active",
        deprecationReason: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockComponentViewReader.findAll.mockResolvedValue(mockComponents);

    await componentsList({}, mockContainer as IApplicationContainer);

    expect(mockComponentViewReader.findAll).toHaveBeenCalledWith("all");
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should filter by status when specified", async () => {
    mockComponentViewReader.findAll.mockResolvedValue([]);

    await componentsList({ status: "active" }, mockContainer as IApplicationContainer);

    expect(mockComponentViewReader.findAll).toHaveBeenCalledWith("active");
  });

  it("should show info message when no components exist", async () => {
    mockComponentViewReader.findAll.mockResolvedValue([]);

    await componentsList({}, mockContainer as IApplicationContainer);

    expect(mockComponentViewReader.findAll).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    const mockComponents: ComponentView[] = [
      {
        componentId: "comp_123",
        name: "TestComponent",
        type: "lib",
        description: "Test",
        responsibility: "Testing",
        path: "src/test",
        status: "active",
        deprecationReason: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockComponentViewReader.findAll.mockResolvedValue(mockComponents);

    await componentsList({}, mockContainer as IApplicationContainer);

    expect(mockComponentViewReader.findAll).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
