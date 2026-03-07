/**
 * FsGoalUnblockedEventStore - File system event store for GoalUnblockedEvent.
 *
 * Implements IGoalUnblockedEventWriter and IGoalUnblockedEventReader for
 * persisting and reading goal unblocked events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IGoalUnblockedEventWriter } from "../../../../application/context/goals/unblock/IGoalUnblockedEventWriter.js";
import { IGoalUnblockedEventReader } from "../../../../application/context/goals/unblock/IGoalUnblockedEventReader.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsGoalUnblockedEventStore
  extends FsEventStore
  implements IGoalUnblockedEventWriter, IGoalUnblockedEventReader
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
