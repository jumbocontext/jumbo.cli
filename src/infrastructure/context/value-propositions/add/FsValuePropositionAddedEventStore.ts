/**
 * FsValuePropositionAddedEventStore - File system event store for ValuePropositionAddedEvent event.
 *
 * Implements IValuePropositionAddedEventWriter for persisting value proposition add events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IValuePropositionAddedEventWriter } from "../../../../application/context/value-propositions/add/IValuePropositionAddedEventWriter.js";

export class FsValuePropositionAddedEventStore
  extends FsEventStore
  implements IValuePropositionAddedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
