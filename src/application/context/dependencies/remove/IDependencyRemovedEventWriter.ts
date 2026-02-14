import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing DependencyRemovedEvent to the event store.
 * Used by RemoveDependencyCommandHandler to persist domain events.
 */
export interface IDependencyRemovedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
