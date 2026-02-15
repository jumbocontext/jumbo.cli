/**
 * Tests for dependencies.list CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { dependenciesList } from "../../../../../../src/presentation/cli/commands/dependencies/list/dependencies.list.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { IDependencyViewReader } from "../../../../../../src/application/context/dependencies/get/IDependencyViewReader.js";
import { DependencyView } from "../../../../../../src/application/context/dependencies/DependencyView.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("dependencies.list command", () => {
  let mockContainer: Partial<IApplicationContainer>;
  let mockDependencyViewReader: jest.Mocked<IDependencyViewReader>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockDependencyViewReader = {
      findAll: jest.fn(),
    } as jest.Mocked<IDependencyViewReader>;

    mockContainer = {
      dependencyViewReader: mockDependencyViewReader,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should list all dependencies by default", async () => {
    const mockDependencies: DependencyView[] = [
      {
        dependencyId: "dep_123",
        consumerId: "comp_user",
        providerId: "comp_db",
        endpoint: "/api",
        contract: "REST",
        status: "active",
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
        removedAt: null,
        removalReason: null,
      },
    ];

    mockDependencyViewReader.findAll.mockResolvedValue(mockDependencies);

    await dependenciesList({}, mockContainer as IApplicationContainer);

    expect(mockDependencyViewReader.findAll).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should filter by consumer when specified", async () => {
    mockDependencyViewReader.findAll.mockResolvedValue([]);

    await dependenciesList({ consumer: "comp_user" }, mockContainer as IApplicationContainer);

    expect(mockDependencyViewReader.findAll).toHaveBeenCalledWith({ consumer: "comp_user", provider: undefined });
  });

  it("should show info message when no dependencies exist", async () => {
    mockDependencyViewReader.findAll.mockResolvedValue([]);

    await dependenciesList({}, mockContainer as IApplicationContainer);

    expect(mockDependencyViewReader.findAll).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
