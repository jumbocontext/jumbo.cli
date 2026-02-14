import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing GoalBlockedEvent to the event store.
 * Used by BlockGoalCommandHandler to persist domain events.
 */
export interface IGoalBlockedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
