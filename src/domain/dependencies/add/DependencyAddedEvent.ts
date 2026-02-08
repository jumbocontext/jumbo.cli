/**
 * DependencyAdded Event
 *
 * Emitted when a new dependency relationship is recorded.
 * This is the first event in the Dependency aggregate's lifecycle.
 */

import { BaseEvent } from "../../BaseEvent.js";

export interface DependencyAddedEvent extends BaseEvent {
  readonly type: "DependencyAddedEvent";
  readonly payload: {
    readonly consumerId: string;
    readonly providerId: string;
    readonly endpoint: string | null;
    readonly contract: string | null;
  };
}
