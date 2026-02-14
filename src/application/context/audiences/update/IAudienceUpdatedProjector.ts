import { AudienceUpdatedEvent } from "../../../../domain/audiences/update/AudienceUpdatedEvent.js";

/**
 * Port interface for projecting AudienceUpdatedEvent events to the read model.
 * Used by AudienceUpdatedEventHandler to update the projection store.
 */
export interface IAudienceUpdatedProjector {
  applyAudienceUpdated(event: AudienceUpdatedEvent): Promise<void>;
}
