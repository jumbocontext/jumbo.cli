import { DependencyUpdatedEvent } from "../../../../domain/dependencies/update/DependencyUpdatedEvent.js";

/**
 * Port interface for projecting DependencyUpdatedEvent to the read model.
 * Used by DependencyUpdatedEventHandler to update the projection store.
 */
export interface IDependencyUpdatedProjector {
  applyDependencyUpdated(event: DependencyUpdatedEvent): Promise<void>;
}
