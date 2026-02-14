import { BaseEvent } from "../../../../domain/BaseEvent.js";

/**
 * Port interface for reading dependency events to rehydrate aggregate.
 * Used by RemoveDependencyCommandHandler to load event history.
 */
export interface IDependencyRemovedEventReader {
  readStream(streamId: string): Promise<BaseEvent[]>;
}
