import { BaseEvent } from "../../BaseEvent.js";

/**
 * Emitted when a value proposition is removed from the project.
 */
export interface ValuePropositionRemovedEvent extends BaseEvent {
  readonly type: "ValuePropositionRemovedEvent";
  readonly payload: Record<string, never>; // Empty payload
}
