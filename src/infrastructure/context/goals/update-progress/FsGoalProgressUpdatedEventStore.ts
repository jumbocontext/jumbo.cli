/**
 * FsGoalProgressUpdatedEventStore - File system event store for GoalProgressUpdatedEvent.
 *
 * Implements IGoalProgressUpdatedEventWriter and IGoalProgressUpdatedEventReader for
 * persisting and reading goal progress updated events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IGoalProgressUpdatedEventWriter } from "../../../../application/context/goals/update-progress/IGoalProgressUpdatedEventWriter.js";
import { IGoalProgressUpdatedEventReader } from "../../../../application/context/goals/update-progress/IGoalProgressUpdatedEventReader.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsGoalProgressUpdatedEventStore
  extends FsEventStore
  implements IGoalProgressUpdatedEventWriter, IGoalProgressUpdatedEventReader
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
