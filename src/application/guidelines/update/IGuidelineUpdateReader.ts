import { GuidelineView } from "../GuidelineView.js";

/**
 * Port interface for reading guideline projections.
 * Used by UpdateGuidelineCommandHandler to check guideline existence.
 */
export interface IGuidelineUpdateReader {
  findById(guidelineId: string): Promise<GuidelineView | null>;
}
