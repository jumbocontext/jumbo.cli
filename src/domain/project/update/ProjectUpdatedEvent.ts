/**
 * ProjectUpdated Event
 *
 * Emitted when a project's details are updated.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { ProjectEventType } from "../Constants.js";

export interface ProjectUpdatedEvent extends BaseEvent {
  readonly type: typeof ProjectEventType.UPDATED;
  readonly payload: {
    readonly purpose?: string | null;
  };
}
