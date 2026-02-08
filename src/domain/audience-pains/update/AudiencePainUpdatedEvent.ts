/**
 * AudiencePainUpdated Event
 *
 * Emitted when an audience pain point's details are updated.
 */

import { BaseEvent } from "../../BaseEvent.js";

export interface AudiencePainUpdatedEvent extends BaseEvent {
  readonly type: "AudiencePainUpdatedEvent";
  readonly payload: {
    readonly title?: string;
    readonly description?: string;
  };
}
