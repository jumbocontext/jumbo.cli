import { BaseEvent } from "../../../../domain/BaseEvent.js";

/**
 * Port interface for reading goal events to rehydrate aggregate.
 * Used by StartGoalCommandHandler to load event history.
 */
export interface IGoalStartedEventReader {
  readStream(streamId: string): Promise<BaseEvent[]>;
}
