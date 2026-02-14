/**
 * Port interface for writing ValuePropositionUpdatedEvent events.
 * Infrastructure layer will implement this with FsEventStore.
 */

import { ValuePropositionUpdatedEvent } from "../../../../domain/value-propositions/update/ValuePropositionUpdatedEvent.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

export interface IValuePropositionUpdatedEventWriter {
  /**
   * Appends a ValuePropositionUpdatedEvent event to the event store.
   */
  append(event: ValuePropositionUpdatedEvent): Promise<AppendResult>;

  /**
   * Reads all events for a value proposition aggregate.
   */
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
