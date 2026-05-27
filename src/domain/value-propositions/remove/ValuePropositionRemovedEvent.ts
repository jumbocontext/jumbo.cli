import { BaseEvent } from "../../BaseEvent.js";
import { ValuePropositionEventType } from "../Constants.js";

/**
 * Emitted when a value proposition is removed from the project.
 */
export interface ValuePropositionRemovedEvent extends BaseEvent {
  readonly type: typeof ValuePropositionEventType.REMOVED;
  readonly payload: Record<string, never>; // Empty payload
}
