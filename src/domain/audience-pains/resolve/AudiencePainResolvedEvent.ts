/**
 * AudiencePainResolved Event
 *
 * Emitted when an audience pain point is marked as resolved.
 * Indicates that the problem has been addressed.
 */

import { BaseEvent } from "../../BaseEvent.js";

export interface AudiencePainResolvedEvent extends BaseEvent {
  readonly type: "AudiencePainResolvedEvent";
  readonly payload: {
    readonly resolutionNotes?: string;
  };
}
