import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing GoalClosedEvent to the event store.
 * Used by CloseGoalCommandHandler to persist domain events.
 */
export interface IGoalClosedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
