/**
 * FsGoalRejectedEventStore - File system event store for GoalRejectedEvent.
 *
 * Implements IGoalRejectedEventWriter and IGoalRejectedEventReader for
 * persisting and reading goal rejected events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IGoalRejectedEventWriter } from "../../../../application/context/goals/reject/IGoalRejectedEventWriter.js";
import { IGoalRejectedEventReader } from "../../../../application/context/goals/reject/IGoalRejectedEventReader.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsGoalRejectedEventStore
  extends FsEventStore
  implements IGoalRejectedEventWriter, IGoalRejectedEventReader
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
