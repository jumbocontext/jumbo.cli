/**
 * FsGoalCompletedEventStore - File system event store for GoalCompletedEvent.
 *
 * Implements IGoalCompletedEventWriter and IGoalCompletedEventReader for
 * persisting and reading goal completed events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IGoalCompletedEventWriter } from "../../../../application/context/goals/complete/IGoalCompletedEventWriter.js";
import { IGoalCompletedEventReader } from "../../../../application/context/goals/complete/IGoalCompletedEventReader.js";

export class FsGoalCompletedEventStore
  extends FsEventStore
  implements IGoalCompletedEventWriter, IGoalCompletedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
