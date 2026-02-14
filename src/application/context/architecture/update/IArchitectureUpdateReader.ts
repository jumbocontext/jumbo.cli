import { ArchitectureView } from "../ArchitectureView.js";

/**
 * Port interface for reading architecture projections.
 * Used to fetch updated view after architecture update.
 */
export interface IArchitectureUpdateReader {
  findById(architectureId: string): Promise<ArchitectureView | null>;
}
