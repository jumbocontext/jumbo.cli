/**
 * FsGoalStartedEventStore - File system event store for GoalStartedEvent.
 *
 * Implements IGoalStartedEventWriter and IGoalStartedEventReader for
 * persisting and reading goal start events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IGoalStartedEventWriter } from "../../../../application/context/goals/start/IGoalStartedEventWriter.js";
import { IGoalStartedEventReader } from "../../../../application/context/goals/start/IGoalStartedEventReader.js";

export class FsGoalStartedEventStore
  extends FsEventStore
  implements IGoalStartedEventWriter, IGoalStartedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
