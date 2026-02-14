import { BaseEvent } from "../../../../domain/BaseEvent.js";

/**
 * Port interface for reading goal events to rehydrate aggregate.
 * Used by QualifyGoalCommandHandler to load event history.
 */
export interface IGoalQualifiedEventReader {
  readStream(streamId: string): Promise<BaseEvent[]>;
}
