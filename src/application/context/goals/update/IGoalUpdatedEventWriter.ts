import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing GoalUpdatedEvent to the event store.
 * Used by UpdateGoalCommandHandler to persist domain events.
 */
export interface IGoalUpdatedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
