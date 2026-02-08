/**
 * AudiencePainAdded Event
 *
 * Emitted when an audience pain point is added to the project.
 * This is the first event in the AudiencePain aggregate's lifecycle.
 */

import { BaseEvent } from "../../BaseEvent.js";

export interface AudiencePainAddedEvent extends BaseEvent {
  readonly type: "AudiencePainAddedEvent";
  readonly payload: {
    readonly title: string;
    readonly description: string;
  };
}
