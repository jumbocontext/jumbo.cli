import { BaseEvent } from "../../../../domain/BaseEvent.js";

/**
 * Port interface for reading session events to rehydrate the aggregate.
 * Used by EndSessionCommandHandler to load event history.
 */
export interface ISessionEndedEventReader {
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
