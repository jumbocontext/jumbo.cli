/**
 * FsValuePropositionUpdatedEventStore - File system event store for ValuePropositionUpdatedEvent event.
 *
 * Implements IValuePropositionUpdatedEventWriter for persisting value proposition update events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IValuePropositionUpdatedEventWriter } from "../../../../application/context/value-propositions/update/IValuePropositionUpdatedEventWriter.js";

export class FsValuePropositionUpdatedEventStore
  extends FsEventStore
  implements IValuePropositionUpdatedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
