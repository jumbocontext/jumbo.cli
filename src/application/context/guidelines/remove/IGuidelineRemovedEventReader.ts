import { BaseEvent } from "../../../../domain/BaseEvent.js";

/**
 * Port interface for reading guideline events to rehydrate aggregate.
 * Used by RemoveGuidelineCommandHandler to load event history.
 */
export interface IGuidelineRemovedEventReader {
  readStream(streamId: string): Promise<BaseEvent[]>;
}
