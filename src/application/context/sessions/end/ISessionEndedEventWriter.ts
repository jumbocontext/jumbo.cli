import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing SessionEnded event to the event store.
 * Used by EndSessionCommandHandler to persist domain events.
 */
export interface ISessionEndedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
