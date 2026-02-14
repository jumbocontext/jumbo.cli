import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing GoalResetEvent to the event store.
 * Used by ResetGoalCommandHandler to persist domain events.
 */
export interface IGoalResetEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
