import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing GoalProgressUpdatedEvent to the event store.
 * Used by UpdateGoalProgressCommandHandler to persist domain events.
 */
export interface IGoalProgressUpdatedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
