import { RelationReactivatedEvent } from "../../../../domain/relations/reactivate/RelationReactivatedEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

export interface IRelationReactivatedEventWriter {
  append(event: RelationReactivatedEvent): Promise<AppendResult>;
}
