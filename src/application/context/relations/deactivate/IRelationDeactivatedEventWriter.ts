import { RelationDeactivatedEvent } from "../../../../domain/relations/deactivate/RelationDeactivatedEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

export interface IRelationDeactivatedEventWriter {
  append(event: RelationDeactivatedEvent): Promise<AppendResult>;
}
