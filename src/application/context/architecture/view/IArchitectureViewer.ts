import { ArchitectureView } from "../ArchitectureView.js";

/**
 * Port interface for viewing the current architecture snapshot.
 * Used by ViewArchitectureCommandHandler to read from projections.
 */
export interface IArchitectureViewer {
  view(): Promise<ArchitectureView | null>;
}
