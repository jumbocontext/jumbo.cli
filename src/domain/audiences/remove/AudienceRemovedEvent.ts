/**
 * AudienceRemoved Event
 *
 * Emitted when an audience is removed from the project.
 */

import { BaseEvent } from "../../BaseEvent.js";

export interface AudienceRemovedEvent extends BaseEvent {
  readonly type: "AudienceRemovedEvent";
  readonly payload: {
    readonly name: string; // Captured for event history
    readonly removedReason?: string; // Optional: why it was removed
  };
}
