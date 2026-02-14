import { DependencyRemovedEvent } from "../../../../domain/dependencies/remove/DependencyRemovedEvent.js";

/**
 * Port interface for projecting DependencyRemovedEvent to the read model.
 * Used by DependencyRemovedEventHandler to update the projection store.
 */
export interface IDependencyRemovedProjector {
  applyDependencyRemoved(event: DependencyRemovedEvent): Promise<void>;
}
