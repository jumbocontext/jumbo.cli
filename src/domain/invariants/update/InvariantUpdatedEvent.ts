/**
 * InvariantUpdated Event
 *
 * Emitted when an invariant's details are updated.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { InvariantEventType } from "../Constants.js";

export interface InvariantUpdatedEvent extends BaseEvent {
  readonly type: typeof InvariantEventType.UPDATED;
  readonly payload: {
    readonly title?: string;
    readonly description?: string;
    readonly rationale?: string | null;
  };
}
