import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing SessionStarted event to the event store.
 * Used by StartSessionCommandHandler to persist domain events.
 */
export interface ISessionStartedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
