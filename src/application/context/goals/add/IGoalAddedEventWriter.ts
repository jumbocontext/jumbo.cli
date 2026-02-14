import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing GoalAddedEvent to the event store.
 * Used by AddGoalCommandHandler to persist domain events.
 */
export interface IGoalAddedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
