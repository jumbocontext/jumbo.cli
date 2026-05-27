import { BaseEvent } from "../../BaseEvent.js";
import { ValuePropositionEventType } from "../Constants.js";

/**
 * Emitted when a new value proposition is added to the project.
 */
export interface ValuePropositionAddedEvent extends BaseEvent {
  readonly type: typeof ValuePropositionEventType.ADDED;
  readonly payload: {
    readonly title: string;
    readonly description: string;
    readonly benefit: string;
    readonly measurableOutcome: string | null;
  };
}
