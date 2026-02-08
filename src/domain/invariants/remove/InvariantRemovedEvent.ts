/**
 * InvariantRemoved Event
 *
 * Emitted when an invariant is removed from project knowledge.
 * The invariant is no longer applicable or needed.
 */

import { BaseEvent, ISO8601 } from "../../BaseEvent.js";

export interface InvariantRemovedEvent extends BaseEvent {
  readonly type: "InvariantRemovedEvent";
  readonly payload: {
    readonly removedAt: ISO8601;
  };
}
