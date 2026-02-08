/**
 * DecisionUpdated Event
 *
 * Emitted when a decision's properties are updated.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { DecisionEventType } from "../Constants.js";

export interface DecisionUpdatedEvent extends BaseEvent {
  readonly type: typeof DecisionEventType.UPDATED;
  readonly payload: {
    readonly title?: string;
    readonly context?: string;
    readonly rationale?: string;
    readonly alternatives?: string[];
    readonly consequences?: string;
  };
}
