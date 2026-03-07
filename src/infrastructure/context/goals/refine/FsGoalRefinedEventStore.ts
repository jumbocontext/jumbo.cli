/**
 * FsGoalRefinedEventStore - File system event store for GoalRefinedEvent.
 *
 * Implements IGoalRefineEventWriter and IGoalRefineEventReader for
 * persisting and reading goal refined events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IGoalRefineEventWriter } from "../../../../application/context/goals/refine/IGoalRefineEventWriter.js";
import { IGoalRefineEventReader } from "../../../../application/context/goals/refine/IGoalRefineEventReader.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsGoalRefinedEventStore
  extends FsEventStore
  implements IGoalRefineEventWriter, IGoalRefineEventReader
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
