/**
 * AudienceUpdated Event
 *
 * Emitted when an audience's properties are updated.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { AudiencePriorityType } from "../Constants.js";

export interface AudienceUpdatedEvent extends BaseEvent {
  readonly type: "AudienceUpdatedEvent";
  readonly payload: {
    readonly name?: string;
    readonly description?: string;
    readonly priority?: AudiencePriorityType;
  };
}
