import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing GoalQualifiedEvent to the event store.
 * Used by QualifyGoalCommandHandler to persist domain events.
 */
export interface IGoalQualifiedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
