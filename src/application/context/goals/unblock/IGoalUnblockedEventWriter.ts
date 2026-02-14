import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing GoalUnblockedEvent to the event store.
 * Used by UnblockGoalCommandHandler to persist domain events.
 */
export interface IGoalUnblockedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
