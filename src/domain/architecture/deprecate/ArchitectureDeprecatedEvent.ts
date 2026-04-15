/**
 * ArchitectureDeprecated Event
 *
 * Emitted when the Architecture entity is formally deprecated.
 * Signals that define and update operations are no longer permitted.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { ArchitectureEventType } from "../Constants.js";

export interface ArchitectureDeprecatedEvent extends BaseEvent {
  readonly type: typeof ArchitectureEventType.DEPRECATED;
  readonly payload: {
    readonly reason: string;
  };
}
