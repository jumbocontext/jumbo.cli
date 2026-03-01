import { RepairRequest } from "./RepairRequest.js";
import { RepairResponse } from "./RepairResponse.js";
import { IRepairGateway } from "./IRepairGateway.js";

export class RepairController {
  constructor(
    private readonly gateway: IRepairGateway
  ) {}

  async handle(request: RepairRequest): Promise<RepairResponse> {
    return this.gateway.repair(request);
  }
}
