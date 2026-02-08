/**
 * ComponentRemoved Event
 *
 * Emitted when a component is removed from the system.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { ComponentStatusValue } from "../Constants.js";

export interface ComponentRemovedEvent extends BaseEvent {
  readonly type: "ComponentRemovedEvent";
  readonly payload: {
    readonly status: ComponentStatusValue;
  };
}
