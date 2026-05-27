import { BaseEvent } from "../../BaseEvent.js";
import { ValuePropositionEventType } from "../Constants.js";

/**
 * Emitted when a value proposition is updated.
 */
export interface ValuePropositionUpdatedEvent extends BaseEvent {
  readonly type: typeof ValuePropositionEventType.UPDATED;
  readonly payload: {
    readonly title?: string;
    readonly description?: string;
    readonly benefit?: string;
    readonly measurableOutcome?: string | null;
  };
}
