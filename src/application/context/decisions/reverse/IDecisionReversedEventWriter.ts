/**
 * Port interface for writing DecisionReversed events.
 * Infrastructure layer will implement this with FsEventStore.
 */

import { DecisionReversedEvent } from "../../../../domain/decisions/reverse/DecisionReversedEvent.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

export interface IDecisionReversedEventWriter {
  /**
   * Appends a DecisionReversed event to the event store.
   */
  append(event: DecisionReversedEvent): Promise<AppendResult>;

  /**
   * Reads all events for a decision aggregate.
   */
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
