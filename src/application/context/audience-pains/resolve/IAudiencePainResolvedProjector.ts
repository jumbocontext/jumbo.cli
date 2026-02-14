import { AudiencePainResolvedEvent } from "../../../../domain/audience-pains/resolve/AudiencePainResolvedEvent.js";

/**
 * Port interface for projecting AudiencePainResolvedEvent events to the read model.
 * Used by AudiencePainResolvedEventHandler to update the projection store.
 */
export interface IAudiencePainResolvedProjector {
  applyAudiencePainResolved(event: AudiencePainResolvedEvent): Promise<void>;
}
