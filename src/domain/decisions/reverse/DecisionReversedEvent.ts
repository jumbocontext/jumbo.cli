/**
 * DecisionReversed Event
 *
 * Emitted when a decision is reversed.
 * Marks the decision as no longer applicable with a reason for reversal.
 */

import { BaseEvent, ISO8601 } from "../../BaseEvent.js";
import { DecisionEventType } from "../Constants.js";

export interface DecisionReversedEvent extends BaseEvent {
  readonly type: typeof DecisionEventType.REVERSED;
  readonly payload: {
    readonly reason: string;
    readonly reversedAt: ISO8601;
  };
}
