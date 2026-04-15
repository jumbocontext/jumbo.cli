import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing ArchitectureDeprecatedEvent to the event store.
 */
export interface IArchitectureDeprecatedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
