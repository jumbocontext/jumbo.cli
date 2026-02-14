import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing AudienceAddedEvent events to the event store.
 * Used by AddAudienceCommandHandler to persist domain events.
 */
export interface IAudienceAddedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
