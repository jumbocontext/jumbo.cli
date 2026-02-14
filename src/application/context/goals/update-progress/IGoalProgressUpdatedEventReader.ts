import { BaseEvent } from "../../../../domain/BaseEvent.js";

/**
 * Port interface for reading goal events to rehydrate aggregate.
 * Used by UpdateGoalProgressCommandHandler to load event history.
 */
export interface IGoalProgressUpdatedEventReader {
  readStream(streamId: string): Promise<BaseEvent[]>;
}
