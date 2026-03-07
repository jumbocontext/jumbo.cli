/**
 * FsGoalCodifyingStartedEventStore - File system event store for GoalCodifyingStartedEvent.
 *
 * Implements IGoalCodifyingStartedEventWriter and IGoalCodifyingStartedEventReader for
 * persisting and reading goal codifying started events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IGoalCodifyingStartedEventWriter } from "../../../../application/context/goals/codify/IGoalCodifyingStartedEventWriter.js";
import { IGoalCodifyingStartedEventReader } from "../../../../application/context/goals/codify/IGoalCodifyingStartedEventReader.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsGoalCodifyingStartedEventStore
  extends FsEventStore
  implements IGoalCodifyingStartedEventWriter, IGoalCodifyingStartedEventReader
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
