import { AudiencePainAddedEvent } from "../../../../domain/audience-pains/add/AudiencePainAddedEvent.js";

/**
 * Port interface for projecting AudiencePainAddedEvent events to the read model.
 * Used by AudiencePainAddedEventHandler to update the projection store.
 */
export interface IAudiencePainAddedProjector {
  applyAudiencePainAdded(event: AudiencePainAddedEvent): Promise<void>;
}
