/**
 * Port interface for writing DecisionSuperseded events.
 * Infrastructure layer will implement this with FsEventStore.
 */

import { DecisionSupersededEvent } from "../../../../domain/decisions/supersede/DecisionSupersededEvent.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

export interface IDecisionSupersededEventWriter {
  /**
   * Appends a DecisionSuperseded event to the event store.
   */
  append(event: DecisionSupersededEvent): Promise<AppendResult>;

  /**
   * Reads all events for a decision aggregate.
   */
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
