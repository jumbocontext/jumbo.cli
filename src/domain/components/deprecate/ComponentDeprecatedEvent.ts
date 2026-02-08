/**
 * ComponentDeprecated Event
 *
 * Emitted when a component is marked as deprecated.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { ComponentStatusValue } from "../Constants.js";

export interface ComponentDeprecatedEvent extends BaseEvent {
  readonly type: "ComponentDeprecatedEvent";
  readonly payload: {
    readonly reason: string | null;
    readonly status: ComponentStatusValue;
  };
}
