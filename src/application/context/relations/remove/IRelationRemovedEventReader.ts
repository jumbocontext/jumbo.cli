import { BaseEvent } from "../../../../domain/BaseEvent.js";

/**
 * Port interface for reading RelationRemoved events from the event store.
 * Used by RemoveRelationCommandHandler to rehydrate the Relation aggregate.
 */
export interface IRelationRemovedEventReader {
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
