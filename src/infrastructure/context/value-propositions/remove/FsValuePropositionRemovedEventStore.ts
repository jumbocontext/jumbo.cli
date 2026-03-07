/**
 * FsValuePropositionRemovedEventStore - File system event store for ValuePropositionRemovedEvent event.
 *
 * Implements IValuePropositionRemovedEventWriter for persisting value proposition remove events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IValuePropositionRemovedEventWriter } from "../../../../application/context/value-propositions/remove/IValuePropositionRemovedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsValuePropositionRemovedEventStore
  extends FsEventStore
  implements IValuePropositionRemovedEventWriter
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
