import { RepairRequest } from "./RepairRequest.js";
import { RepairResponse } from "./RepairResponse.js";

export interface IRepairGateway {
  repair(request: RepairRequest): Promise<RepairResponse>;
}
