/**
 * AudiencePainUpdated Event
 *
 * Emitted when an audience pain point's details are updated.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { AudiencePainEventType } from "../Constants.js";

export interface AudiencePainUpdatedEvent extends BaseEvent {
  readonly type: typeof AudiencePainEventType.UPDATED;
  readonly payload: {
    readonly title?: string;
    readonly description?: string;
  };
}
