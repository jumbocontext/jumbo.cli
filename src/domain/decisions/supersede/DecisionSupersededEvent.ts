/**
 * DecisionSuperseded Event
 *
 * Emitted when a decision is superseded by another decision.
 * Marks the decision as no longer applicable because it has been replaced.
 */

import { BaseEvent, UUID } from "../../BaseEvent.js";
import { DecisionEventType } from "../Constants.js";

export interface DecisionSupersededEvent extends BaseEvent {
  readonly type: typeof DecisionEventType.SUPERSEDED;
  readonly payload: {
    readonly supersededBy: UUID;
  };
}
