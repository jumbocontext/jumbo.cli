/**
 * InvariantAdded Event
 *
 * Emitted when an invariant is added to the project.
 * Invariants are non-negotiable requirements or boundaries.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { InvariantEventType } from "../Constants.js";

export interface InvariantAddedEvent extends BaseEvent {
  readonly type: typeof InvariantEventType.ADDED;
  readonly payload: {
    readonly title: string;
    readonly description: string;
    readonly rationale: string | null;
  };
}
