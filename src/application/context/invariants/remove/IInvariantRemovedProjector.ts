import { InvariantRemovedEvent } from "../../../../domain/invariants/remove/InvariantRemovedEvent.js";

/**
 * Port interface for projecting InvariantRemovedEvent to the read model.
 * Used by InvariantRemovedEventHandler to update the projection store.
 */
export interface IInvariantRemovedProjector {
  applyInvariantRemoved(event: InvariantRemovedEvent): Promise<void>;
}
