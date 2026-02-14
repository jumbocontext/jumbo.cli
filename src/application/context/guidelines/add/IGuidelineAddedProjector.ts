import { GuidelineAddedEvent } from "../../../../domain/guidelines/add/GuidelineAddedEvent.js";

/**
 * Port interface for projecting GuidelineAddedEvent to the read model.
 * Used by GuidelineAddedEventHandler to update the projection store.
 */
export interface IGuidelineAddedProjector {
  applyGuidelineAdded(event: GuidelineAddedEvent): Promise<void>;
}
