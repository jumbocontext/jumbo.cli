/**
 * DecisionAdded Event
 *
 * Emitted when a decision is first added.
 * This is the first event in the Decision aggregate's lifecycle.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { DecisionEventType } from "../Constants.js";

export interface DecisionAddedEvent extends BaseEvent {
  readonly type: typeof DecisionEventType.ADDED;
  readonly payload: {
    readonly title: string;
    readonly context: string;
    readonly rationale: string | null;
    readonly alternatives: string[];
    readonly consequences: string | null;
  };
}
