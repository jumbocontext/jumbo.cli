/**
 * AudiencePainAdded Event
 *
 * Emitted when an audience pain point is added to the project.
 * This is the first event in the AudiencePain aggregate's lifecycle.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { AudiencePainEventType } from "../Constants.js";

export interface AudiencePainAddedEvent extends BaseEvent {
  readonly type: typeof AudiencePainEventType.ADDED;
  readonly payload: {
    readonly title: string;
    readonly description: string;
  };
}
