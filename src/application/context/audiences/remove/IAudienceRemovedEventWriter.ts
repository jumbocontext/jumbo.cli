import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing AudienceRemovedEvent events to the event store.
 * Used by RemoveAudienceCommandHandler to persist domain events.
 */
export interface IAudienceRemovedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
