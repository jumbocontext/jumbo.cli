import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing AudiencePainAdded events to the event store.
 * Used by AddAudiencePainCommandHandler to persist domain events.
 */
export interface IAudiencePainAddedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
