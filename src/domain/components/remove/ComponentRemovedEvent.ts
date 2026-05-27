/**
 * ComponentRemoved Event
 *
 * Emitted when a component is removed from the system.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { ComponentEventType, ComponentStatusValue } from "../Constants.js";

export interface ComponentRemovedEvent extends BaseEvent {
  readonly type: typeof ComponentEventType.REMOVED;
  readonly payload: {
    readonly status: ComponentStatusValue;
  };
}
