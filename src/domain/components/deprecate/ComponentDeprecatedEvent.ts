/**
 * ComponentDeprecated Event
 *
 * Emitted when a component is marked as deprecated.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { ComponentEventType, ComponentStatusValue } from "../Constants.js";

export interface ComponentDeprecatedEvent extends BaseEvent {
  readonly type: typeof ComponentEventType.DEPRECATED;
  readonly payload: {
    readonly reason: string | null;
    readonly status: ComponentStatusValue;
  };
}
