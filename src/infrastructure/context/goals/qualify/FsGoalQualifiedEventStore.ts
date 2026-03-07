/**
 * FsGoalQualifiedEventStore - File system event store for GoalQualifiedEvent.
 *
 * Implements IGoalQualifiedEventWriter and IGoalQualifiedEventReader for
 * persisting and reading goal qualified events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IGoalQualifiedEventWriter } from "../../../../application/context/goals/qualify/IGoalQualifiedEventWriter.js";
import { IGoalQualifiedEventReader } from "../../../../application/context/goals/qualify/IGoalQualifiedEventReader.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsGoalQualifiedEventStore
  extends FsEventStore
  implements IGoalQualifiedEventWriter, IGoalQualifiedEventReader
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
