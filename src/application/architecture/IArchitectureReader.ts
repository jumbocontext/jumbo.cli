import { ArchitectureView } from "./ArchitectureView.js";

/**
 * Port interface for reading architecture.
 * Used to retrieve global architecture context.
 */
export interface IArchitectureReader {
  find(): Promise<ArchitectureView | null>;
}
