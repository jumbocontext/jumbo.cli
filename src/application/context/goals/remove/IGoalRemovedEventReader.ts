import { BaseEvent } from "../../../../domain/BaseEvent.js";

/**
 * Port interface for reading goal events to rehydrate aggregate.
 * Used by RemoveGoalCommandHandler to load event history.
 */
export interface IGoalRemovedEventReader {
  readStream(streamId: string): Promise<BaseEvent[]>;
}
