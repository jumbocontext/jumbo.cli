/**
 * GuidelineRemoved Event
 *
 * Emitted when a guideline is removed.
 * The guideline remains in the event store but is marked as removed in projections.
 */

import { BaseEvent, ISO8601 } from "../../BaseEvent.js";

export interface GuidelineRemovedEvent extends BaseEvent {
  readonly type: "GuidelineRemovedEvent";
  readonly payload: {
    readonly removedAt: ISO8601;
    readonly reason?: string;
  };
}
