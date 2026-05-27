/**
 * AudienceRemoved Event
 *
 * Emitted when an audience is removed from the project.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { AudienceEventType } from "../Constants.js";

export interface AudienceRemovedEvent extends BaseEvent {
  readonly type: typeof AudienceEventType.REMOVED;
  readonly payload: {
    readonly name: string; // Captured for event history
    readonly removedReason?: string; // Optional: why it was removed
  };
}
