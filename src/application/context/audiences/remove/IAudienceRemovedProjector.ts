import { AudienceRemovedEvent } from "../../../../domain/audiences/remove/AudienceRemovedEvent.js";

/**
 * Port interface for projecting AudienceRemovedEvent events to the read model.
 * Used by AudienceRemovedEventHandler to update the projection store.
 */
export interface IAudienceRemovedProjector {
  applyAudienceRemoved(event: AudienceRemovedEvent): Promise<void>;
}
