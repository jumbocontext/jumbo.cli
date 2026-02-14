import { SessionStartedEvent } from "../../../../domain/sessions/start/SessionStartedEvent.js";

/**
 * Port interface for projecting SessionStartedEvent event to the read model.
 * Used by SessionStartedEventHandler to update the projection store.
 */
export interface ISessionStartedProjector {
  applySessionStarted(event: SessionStartedEvent): Promise<void>;
}
