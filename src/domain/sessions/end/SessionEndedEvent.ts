import { BaseEvent } from "../../BaseEvent.js";
import { SessionEventType } from "../Constants.js";

/**
 * Emitted when a session is ended.
 * Captures the final focus/summary of work accomplished.
 */
export interface SessionEndedEvent extends BaseEvent {
  readonly type: typeof SessionEventType.ENDED;
  readonly payload: {
    readonly focus: string;
    readonly summary: string | null;
  };
}
