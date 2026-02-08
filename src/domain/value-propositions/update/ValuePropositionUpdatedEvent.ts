import { BaseEvent } from "../../BaseEvent.js";

/**
 * Emitted when a value proposition is updated.
 */
export interface ValuePropositionUpdatedEvent extends BaseEvent {
  readonly type: "ValuePropositionUpdatedEvent";
  readonly payload: {
    readonly title?: string;
    readonly description?: string;
    readonly benefit?: string;
    readonly measurableOutcome?: string | null;
  };
}
