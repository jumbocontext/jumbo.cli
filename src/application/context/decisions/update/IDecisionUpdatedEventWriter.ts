/**
 * Port interface for writing DecisionUpdated events.
 * Infrastructure layer will implement this with FsEventStore.
 */

import { DecisionUpdatedEvent } from "../../../../domain/decisions/update/DecisionUpdatedEvent.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

export interface IDecisionUpdatedEventWriter {
  /**
   * Appends a DecisionUpdated event to the event store.
   */
  append(event: DecisionUpdatedEvent): Promise<AppendResult>;

  /**
   * Reads all events for a decision aggregate.
   */
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
