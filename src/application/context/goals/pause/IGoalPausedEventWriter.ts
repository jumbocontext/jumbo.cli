import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing GoalPausedEvent to the event store.
 * Used by PauseGoalCommandHandler to persist domain events.
 */
export interface IGoalPausedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
