import { BaseEvent } from "../../../../domain/BaseEvent.js";

/**
 * Port interface for reading goal events to rehydrate aggregate.
 * Used by UnblockGoalCommandHandler to load event history.
 */
export interface IGoalUnblockedEventReader {
  readStream(streamId: string): Promise<BaseEvent[]>;
}
