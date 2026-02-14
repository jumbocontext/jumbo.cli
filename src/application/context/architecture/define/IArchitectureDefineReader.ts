import { ArchitectureView } from "../ArchitectureView.js";

/**
 * Port interface for reading architecture data needed during define operations.
 * Used by DefineArchitectureCommandHandler to check if architecture already exists.
 */
export interface IArchitectureDefineReader {
  findById(id: string): Promise<ArchitectureView | null>;
}
