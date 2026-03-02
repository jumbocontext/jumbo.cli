/**
 * DecisionRestored Event
 *
 * Emitted when a reversed or superseded decision is restored to active status.
 */

import { BaseEvent, ISO8601 } from "../../BaseEvent.js";
import { DecisionEventType } from "../Constants.js";

export interface DecisionRestoredEvent extends BaseEvent {
  readonly type: typeof DecisionEventType.RESTORED;
  readonly payload: {
    readonly reason: string;
    readonly restoredAt: ISO8601;
  };
}
