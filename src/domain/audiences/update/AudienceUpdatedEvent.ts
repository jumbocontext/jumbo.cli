/**
 * AudienceUpdated Event
 *
 * Emitted when an audience's properties are updated.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { AudienceEventType, AudiencePriorityType } from "../Constants.js";

export interface AudienceUpdatedEvent extends BaseEvent {
  readonly type: typeof AudienceEventType.UPDATED;
  readonly payload: {
    readonly name?: string;
    readonly description?: string;
    readonly priority?: AudiencePriorityType;
  };
}
