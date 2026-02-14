import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing GoalRefinedEvent to the event store.
 * Used by RefineGoalCommandHandler to persist domain events.
 */
export interface IGoalRefineEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
