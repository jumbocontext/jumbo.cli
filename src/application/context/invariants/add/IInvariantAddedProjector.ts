import { InvariantAddedEvent } from "../../../../domain/invariants/add/InvariantAddedEvent.js";

/**
 * Port interface for projecting InvariantAddedEvent to the read model.
 * Used by InvariantAddedEventHandler to update the projection store.
 */
export interface IInvariantAddedProjector {
  applyInvariantAdded(event: InvariantAddedEvent): Promise<void>;
}
