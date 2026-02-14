/**
 * FsValuePropositionRemovedEventStore - File system event store for ValuePropositionRemovedEvent event.
 *
 * Implements IValuePropositionRemovedEventWriter for persisting value proposition remove events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IValuePropositionRemovedEventWriter } from "../../../../application/context/value-propositions/remove/IValuePropositionRemovedEventWriter.js";

export class FsValuePropositionRemovedEventStore
  extends FsEventStore
  implements IValuePropositionRemovedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
