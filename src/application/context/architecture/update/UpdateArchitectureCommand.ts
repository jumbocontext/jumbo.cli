import { DataStore } from "../../../../domain/architecture/EventIndex.js";

export interface UpdateArchitectureCommand {
  description?: string;
  organization?: string;
  patterns?: string[];
  principles?: string[];
  dataStores?: DataStore[];
  stack?: string[];
}
