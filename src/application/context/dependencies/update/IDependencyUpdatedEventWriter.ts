import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing DependencyUpdatedEvent to the event store.
 * Used by UpdateDependencyCommandHandler to persist domain events.
 */
export interface IDependencyUpdatedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
