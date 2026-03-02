/**
 * ComponentUndeprecated Event
 *
 * Emitted when a deprecated component is restored to active status.
 */

import { BaseEvent, ISO8601 } from "../../BaseEvent.js";
import { ComponentEventType } from "../Constants.js";

export interface ComponentUndeprecatedEvent extends BaseEvent {
  readonly type: typeof ComponentEventType.UNDEPRECATED;
  readonly payload: {
    readonly reason: string;
    readonly undeprecatedAt: ISO8601;
  };
}
