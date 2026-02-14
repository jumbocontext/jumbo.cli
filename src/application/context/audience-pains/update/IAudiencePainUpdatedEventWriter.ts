import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing AudiencePainUpdated events to the event store.
 * Used by UpdateAudiencePainCommandHandler to persist domain events.
 */
export interface IAudiencePainUpdatedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
