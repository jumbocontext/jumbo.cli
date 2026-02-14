import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing InvariantUpdatedEvent to the event store.
 * Used by UpdateInvariantCommandHandler to persist domain events.
 */
export interface IInvariantUpdatedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
