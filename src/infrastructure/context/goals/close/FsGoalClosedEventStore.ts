/**
 * FsGoalClosedEventStore - File system event store for GoalClosedEvent.
 *
 * Implements IGoalClosedEventWriter and IGoalClosedEventReader for
 * persisting and reading goal closed events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IGoalClosedEventWriter } from "../../../../application/context/goals/close/IGoalClosedEventWriter.js";
import { IGoalClosedEventReader } from "../../../../application/context/goals/close/IGoalClosedEventReader.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsGoalClosedEventStore
  extends FsEventStore
  implements IGoalClosedEventWriter, IGoalClosedEventReader
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
