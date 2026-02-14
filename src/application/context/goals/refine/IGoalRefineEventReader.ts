import { BaseEvent } from "../../../../domain/BaseEvent.js";

/**
 * Port interface for reading goal events to rehydrate aggregate.
 * Used by RefineGoalCommandHandler to load event history.
 */
export interface IGoalRefineEventReader {
  readStream(streamId: string): Promise<BaseEvent[]>;
}
