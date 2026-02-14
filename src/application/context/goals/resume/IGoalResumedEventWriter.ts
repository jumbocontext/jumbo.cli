import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing GoalResumedEvent to the event store.
 * Used by ResumeGoalCommandHandler to persist domain events.
 */
export interface IGoalResumedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
