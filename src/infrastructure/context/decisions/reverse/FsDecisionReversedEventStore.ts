/**
 * FsDecisionReversedEventStore - File system event store for DecisionReversed event.
 *
 * Implements IDecisionReversedEventWriter for persisting decision reverse events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IDecisionReversedEventWriter } from "../../../../application/context/decisions/reverse/IDecisionReversedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsDecisionReversedEventStore
  extends FsEventStore
  implements IDecisionReversedEventWriter
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
