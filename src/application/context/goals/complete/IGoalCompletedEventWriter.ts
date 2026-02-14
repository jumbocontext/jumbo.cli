import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing GoalCompletedEvent to the event store.
 * Used by CompleteGoalCommandHandler to persist domain events.
 */
export interface IGoalCompletedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
