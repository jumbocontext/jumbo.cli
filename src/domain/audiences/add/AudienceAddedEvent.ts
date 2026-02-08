/**
 * AudienceAdded Event
 *
 * Emitted when a target audience is added to the project.
 * This is the first event in the Audience aggregate's lifecycle.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { AudiencePriorityType } from "../Constants.js";

export interface AudienceAddedEvent extends BaseEvent {
  readonly type: "AudienceAddedEvent";
  readonly payload: {
    readonly name: string;
    readonly description: string;
    readonly priority: AudiencePriorityType;
  };
}
