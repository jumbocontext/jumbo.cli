import { GuidelineView } from "../GuidelineView.js";
import { UUID } from "../../../../domain/BaseEvent.js";

/**
 * Port interface for reading guideline views during remove operations.
 * Provides findById method with includeRemoved option to view just-removed guidelines.
 */
export interface IGuidelineRemoveReader {
  findById(id: UUID, includeRemoved?: boolean): Promise<GuidelineView | null>;
}
