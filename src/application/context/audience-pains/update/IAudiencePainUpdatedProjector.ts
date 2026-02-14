import { AudiencePainUpdatedEvent } from "../../../../domain/audience-pains/update/AudiencePainUpdatedEvent.js";

/**
 * Port interface for projecting AudiencePainUpdatedEvent events to the read model.
 * Used by AudiencePainUpdatedEventHandler to update the projection store.
 */
export interface IAudiencePainUpdatedProjector {
  applyAudiencePainUpdated(event: AudiencePainUpdatedEvent): Promise<void>;
}
