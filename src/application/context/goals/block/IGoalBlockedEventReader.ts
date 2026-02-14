import { BaseEvent } from "../../../../domain/BaseEvent.js";

/**
 * Port interface for reading goal events to rehydrate aggregate.
 * Used by BlockGoalCommandHandler to load event history.
 */
export interface IGoalBlockedEventReader {
  readStream(streamId: string): Promise<BaseEvent[]>;
}
