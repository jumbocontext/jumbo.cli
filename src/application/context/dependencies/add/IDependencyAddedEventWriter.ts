import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing DependencyAddedEvent to the event store.
 * Used by AddDependencyCommandHandler to persist domain events.
 */
export interface IDependencyAddedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
