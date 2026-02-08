/**
 * ComponentUpdated Event
 *
 * Emitted when an existing component is updated.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { ComponentTypeValue } from "../Constants.js";

export interface ComponentUpdatedEvent extends BaseEvent {
  readonly type: "ComponentUpdatedEvent";
  readonly payload: {
    readonly description?: string;
    readonly responsibility?: string;
    readonly path?: string;
    readonly type?: ComponentTypeValue;
  };
}
