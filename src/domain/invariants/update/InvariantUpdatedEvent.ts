/**
 * InvariantUpdated Event
 *
 * Emitted when an invariant's details are updated.
 */

import { BaseEvent } from "../../BaseEvent.js";

export interface InvariantUpdatedEvent extends BaseEvent {
  readonly type: "InvariantUpdatedEvent";
  readonly payload: {
    readonly title?: string;
    readonly description?: string;
    readonly rationale?: string | null;
  };
}
