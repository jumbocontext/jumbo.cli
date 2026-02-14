import { BaseEvent } from "../../../../domain/BaseEvent.js";

/**
 * Port interface for reading goal events to rehydrate aggregate.
 * Used by CompleteGoalCommandHandler to load event history.
 */
export interface IGoalCompletedEventReader {
  readStream(streamId: string): Promise<BaseEvent[]>;
}
