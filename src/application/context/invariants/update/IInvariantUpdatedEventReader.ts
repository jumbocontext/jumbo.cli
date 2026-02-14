import { BaseEvent } from "../../../../domain/BaseEvent.js";

/**
 * Port interface for reading invariant events to rehydrate aggregate.
 * Used by UpdateInvariantCommandHandler to load event history.
 */
export interface IInvariantUpdatedEventReader {
  readStream(streamId: string): Promise<BaseEvent[]>;
}
