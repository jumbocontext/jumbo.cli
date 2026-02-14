import { BaseEvent } from "../../../../domain/BaseEvent.js";

/**
 * Port interface for reading dependency events to rehydrate aggregate.
 * Used by UpdateDependencyCommandHandler to load event history.
 */
export interface IDependencyUpdatedEventReader {
  readStream(streamId: string): Promise<BaseEvent[]>;
}
