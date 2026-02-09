/**
 * ProjectUpdated Event
 *
 * Emitted when a project's details are updated.
 */

import { BaseEvent } from "../../BaseEvent.js";

export interface ProjectUpdatedEvent extends BaseEvent {
  readonly type: "ProjectUpdatedEvent";
  readonly payload: {
    readonly purpose?: string | null;
  };
}
