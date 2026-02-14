/**
 * Port interface for writing DecisionAdded events.
 * Infrastructure layer will implement this with FsEventStore.
 */

import { DecisionAddedEvent } from "../../../../domain/decisions/add/DecisionAddedEvent.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

export interface IDecisionAddedEventWriter {
  /**
   * Appends a DecisionAdded event to the event store.
   */
  append(event: DecisionAddedEvent): Promise<AppendResult>;

  /**
   * Reads all events for a decision aggregate.
   */
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
