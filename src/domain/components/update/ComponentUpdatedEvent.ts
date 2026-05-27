/**
 * ComponentUpdated Event
 *
 * Emitted when an existing component is updated.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { ComponentEventType, ComponentTypeValue } from "../Constants.js";

export interface ComponentUpdatedEvent extends BaseEvent {
  readonly type: typeof ComponentEventType.UPDATED;
  readonly payload: {
    readonly description?: string;
    readonly responsibility?: string;
    readonly path?: string;
    readonly type?: ComponentTypeValue;
  };
}
