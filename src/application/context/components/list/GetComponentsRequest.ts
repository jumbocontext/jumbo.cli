import { ComponentStatusFilter } from "../get/IComponentViewReader.js";

export interface GetComponentsRequest {
  readonly status: ComponentStatusFilter;
}
