import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing ArchitectureDefinedEvent to the event store.
 * Used by DefineArchitectureCommandHandler to persist domain events.
 */
export interface IArchitectureDefinedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
