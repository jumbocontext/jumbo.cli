import { RelationReactivatedEvent } from "../../../../domain/relations/reactivate/RelationReactivatedEvent.js";

export interface IRelationReactivatedProjector {
  applyRelationReactivated(event: RelationReactivatedEvent): Promise<void>;
}
