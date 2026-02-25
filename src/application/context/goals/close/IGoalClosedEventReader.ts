import { BaseEvent } from "../../../../domain/BaseEvent.js";

/**
 * Port interface for reading goal events to rehydrate aggregate.
 * Used by CloseGoalCommandHandler to load event history.
 */
export interface IGoalClosedEventReader {
  readStream(streamId: string): Promise<BaseEvent[]>;
}
