/**
 * FsGoalResetEventStore - File system event store for GoalResetEvent.
 *
 * Implements IGoalResetEventWriter and IGoalResetEventReader for
 * persisting and reading goal reset events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IGoalResetEventWriter } from "../../../../application/context/goals/reset/IGoalResetEventWriter.js";
import { IGoalResetEventReader } from "../../../../application/context/goals/reset/IGoalResetEventReader.js";

export class FsGoalResetEventStore
  extends FsEventStore
  implements IGoalResetEventWriter, IGoalResetEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
