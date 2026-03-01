import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { RepairController } from "../../../src/application/repair/RepairController.js";
import { IRepairGateway } from "../../../src/application/repair/IRepairGateway.js";
import { RepairResponse } from "../../../src/application/repair/RepairResponse.js";

describe("RepairController", () => {
  let controller: RepairController;
  let mockGateway: jest.Mocked<IRepairGateway>;

  beforeEach(() => {
    mockGateway = {
      repair: jest.fn(),
    } as jest.Mocked<IRepairGateway>;

    controller = new RepairController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const expectedResponse: RepairResponse = {
      steps: [
        { name: "AGENTS.md", status: "repaired" },
        { name: "Agent configurations", status: "repaired" },
        { name: "Settings", status: "repaired" },
        { name: "Database", status: "repaired", detail: "42 events replayed" },
      ],
    };

    mockGateway.repair.mockResolvedValue(expectedResponse);

    const response = await controller.handle({
      doAgents: true,
      doSettings: true,
      doDb: true,
    });

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.repair).toHaveBeenCalledWith({
      doAgents: true,
      doSettings: true,
      doDb: true,
    });
  });

  it("should pass skip flags through to gateway", async () => {
    mockGateway.repair.mockResolvedValue({ steps: [] });

    await controller.handle({
      doAgents: false,
      doSettings: false,
      doDb: false,
    });

    expect(mockGateway.repair).toHaveBeenCalledWith({
      doAgents: false,
      doSettings: false,
      doDb: false,
    });
  });
});
