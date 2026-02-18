import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalAddDependencyGateway } from "../../../../../src/application/context/dependencies/add/LocalAddDependencyGateway.js";
import { AddDependencyCommandHandler } from "../../../../../src/application/context/dependencies/add/AddDependencyCommandHandler.js";

describe("LocalAddDependencyGateway", () => {
  let gateway: LocalAddDependencyGateway;
  let mockCommandHandler: jest.Mocked<AddDependencyCommandHandler>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AddDependencyCommandHandler>;

    gateway = new LocalAddDependencyGateway(mockCommandHandler);
  });

  it("should execute command and return dependency id", async () => {
    const dependencyId = "dep_userservice_databaseclient";

    mockCommandHandler.execute.mockResolvedValue({ dependencyId });

    const response = await gateway.addDependency({
      consumerId: "UserService",
      providerId: "DatabaseClient",
      endpoint: "/api/users",
      contract: "IUserRepository",
    });

    expect(response.dependencyId).toBe(dependencyId);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      consumerId: "UserService",
      providerId: "DatabaseClient",
      endpoint: "/api/users",
      contract: "IUserRepository",
    });
  });

  it("should handle request with only required fields", async () => {
    const dependencyId = "dep_authcontroller_authmiddleware";

    mockCommandHandler.execute.mockResolvedValue({ dependencyId });

    const response = await gateway.addDependency({
      consumerId: "AuthController",
      providerId: "AuthMiddleware",
    });

    expect(response.dependencyId).toBe(dependencyId);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      consumerId: "AuthController",
      providerId: "AuthMiddleware",
      endpoint: undefined,
      contract: undefined,
    });
  });
});
