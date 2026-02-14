import { RelationAddedEvent } from "../../../../domain/relations/add/RelationAddedEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing RelationAddedEvent event to the event store.
 * Used by AddRelationCommandHandler to persist domain events.
 */
export interface IRelationAddedEventWriter {
  append(event: RelationAddedEvent): Promise<AppendResult>;
}
