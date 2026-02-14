import { RelationRemovedEvent } from "../../../../domain/relations/remove/RelationRemovedEvent.js";

/**
 * Port interface for projecting RelationRemovedEvent event to the read model.
 * Used by RelationRemovedEventHandler to update the projection store.
 */
export interface IRelationRemovedProjector {
  applyRelationRemoved(event: RelationRemovedEvent): Promise<void>;
}
