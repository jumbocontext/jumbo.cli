import { RelationRemovedEvent } from "../../../../domain/relations/remove/RelationRemovedEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing RelationRemovedEvent event to the event store.
 * Used by RemoveRelationCommandHandler to persist domain events.
 */
export interface IRelationRemovedEventWriter {
  append(event: RelationRemovedEvent): Promise<AppendResult>;
}
