import { DataStore } from "../../../domain/architecture/EventIndex.js";

export interface ArchitectureView {
  architectureId: string;
  description: string;
  organization: string;
  patterns: string[];
  principles: string[];
  dataStores: DataStore[];
  stack: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
}
