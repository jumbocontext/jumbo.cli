/**
 * InvariantAdded Event
 *
 * Emitted when an invariant is added to the project.
 * Invariants are non-negotiable requirements or boundaries.
 */

import { BaseEvent } from "../../BaseEvent.js";

export interface InvariantAddedEvent extends BaseEvent {
  readonly type: "InvariantAddedEvent";
  readonly payload: {
    readonly title: string;
    readonly description: string;
    readonly rationale: string | null;
    readonly enforcement: string;
  };
}
