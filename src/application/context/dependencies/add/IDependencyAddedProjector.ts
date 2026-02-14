import { DependencyAddedEvent } from "../../../../domain/dependencies/add/DependencyAddedEvent.js";

/**
 * Port interface for projecting DependencyAddedEvent to the read model.
 * Used by DependencyAddedEventHandler to update the projection store.
 */
export interface IDependencyAddedProjector {
  applyDependencyAdded(event: DependencyAddedEvent): Promise<void>;
}
