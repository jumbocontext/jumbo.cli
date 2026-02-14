import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing GuidelineUpdatedEvent to the event store.
 * Used by UpdateGuidelineCommandHandler to persist domain events.
 */
export interface IGuidelineUpdatedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
