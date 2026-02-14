import { RelationAddedEvent } from "../../../../domain/relations/add/RelationAddedEvent.js";

/**
 * Port interface for projecting RelationAddedEvent event to the read model.
 * Used by RelationAddedEventHandler to update the projection store.
 */
export interface IRelationAddedProjector {
  applyRelationAdded(event: RelationAddedEvent): Promise<void>;
}
