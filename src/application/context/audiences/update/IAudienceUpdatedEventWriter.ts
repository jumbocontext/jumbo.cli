import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing AudienceUpdatedEvent events to the event store.
 * Used by UpdateAudienceCommandHandler to persist domain events.
 */
export interface IAudienceUpdatedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
