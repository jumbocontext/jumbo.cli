/**
 * FsGoalResumedEventStore - File system event store for GoalResumedEvent.
 *
 * Implements IGoalResumedEventWriter and IGoalResumedEventReader for
 * persisting and reading goal resume events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../persistence/FsEventStore.js";
import { IGoalResumedEventWriter } from "../../../application/goals/resume/IGoalResumedEventWriter.js";
import { IGoalResumedEventReader } from "../../../application/goals/resume/IGoalResumedEventReader.js";

export class FsGoalResumedEventStore
  extends FsEventStore
  implements IGoalResumedEventWriter, IGoalResumedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
