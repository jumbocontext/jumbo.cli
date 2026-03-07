/**
 * FsDecisionUpdatedEventStore - File system event store for DecisionUpdated event.
 *
 * Implements IDecisionUpdatedEventWriter for persisting decision update events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IDecisionUpdatedEventWriter } from "../../../../application/context/decisions/update/IDecisionUpdatedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsDecisionUpdatedEventStore
  extends FsEventStore
  implements IDecisionUpdatedEventWriter
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
