import { BaseEvent } from "../../../../domain/BaseEvent.js";

/**
 * Port interface for reading architecture events to rehydrate aggregate.
 * Used by UpdateArchitectureCommandHandler to load event history.
 */
export interface IArchitectureUpdatedEventReader {
  readStream(streamId: string): Promise<BaseEvent[]>;
}
