import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AddDependencyController } from "../../../../../src/application/context/dependencies/add/AddDependencyController.js";
import { IAddDependencyGateway } from "../../../../../src/application/context/dependencies/add/IAddDependencyGateway.js";

describe("AddDependencyController", () => {
  let controller: AddDependencyController;
  let mockGateway: jest.Mocked<IAddDependencyGateway>;

  beforeEach(() => {
    mockGateway = {
      addDependency: jest.fn(),
    } as jest.Mocked<IAddDependencyGateway>;

    controller = new AddDependencyController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      consumerId: "UserService",
      providerId: "DatabaseClient",
      endpoint: "/api/users",
      contract: "IUserRepository",
    };

    const expectedResponse = {
      dependencyId: "dep_userservice_databaseclient",
    };

    mockGateway.addDependency.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.addDependency).toHaveBeenCalledWith(request);
  });

  it("should handle request with only required fields", async () => {
    const request = {
      consumerId: "AuthController",
      providerId: "AuthMiddleware",
    };

    const expectedResponse = {
      dependencyId: "dep_authcontroller_authmiddleware",
    };

    mockGateway.addDependency.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.addDependency).toHaveBeenCalledWith(request);
  });
});
