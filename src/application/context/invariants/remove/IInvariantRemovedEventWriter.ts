import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing InvariantRemovedEvent to the event store.
 * Used by RemoveInvariantCommandHandler to persist domain events.
 */
export interface IInvariantRemovedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
