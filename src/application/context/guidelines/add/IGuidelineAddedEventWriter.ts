import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing GuidelineAddedEvent to the event store.
 * Used by AddGuidelineCommandHandler to persist domain events.
 */
export interface IGuidelineAddedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
