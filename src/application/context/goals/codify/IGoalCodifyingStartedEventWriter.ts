import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing GoalCodifyingStartedEvent to the event store.
 * Used by CodifyGoalCommandHandler to persist domain events.
 */
export interface IGoalCodifyingStartedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
