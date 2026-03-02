/**
 * DependencyUpdated Event
 *
 * Emitted when a dependency's properties are updated.
 * Supports partial updates (only changed fields in payload).
 */

import { BaseEvent } from "../../BaseEvent.js";
import { DependencyEventType, DependencyStatusType } from "../Constants.js";

export interface DependencyUpdatedEvent extends BaseEvent {
  readonly type: typeof DependencyEventType.UPDATED;
  readonly payload: {
    readonly endpoint?: string | null;
    readonly contract?: string | null;
    readonly status?: DependencyStatusType;
  };
}
