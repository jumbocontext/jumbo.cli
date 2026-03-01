import { RelationDeactivatedEvent } from "../../../../domain/relations/deactivate/RelationDeactivatedEvent.js";

export interface IRelationDeactivatedProjector {
  applyRelationDeactivated(event: RelationDeactivatedEvent): Promise<void>;
}
