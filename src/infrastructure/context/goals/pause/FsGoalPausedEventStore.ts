/**
 * FsGoalPausedEventStore - File system event store for GoalPausedEvent.
 *
 * Implements IGoalPausedEventWriter and IGoalPausedEventReader for
 * persisting and reading goal pause events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IGoalPausedEventWriter } from "../../../../application/context/goals/pause/IGoalPausedEventWriter.js";
import { IGoalPausedEventReader } from "../../../../application/context/goals/pause/IGoalPausedEventReader.js";

export class FsGoalPausedEventStore
  extends FsEventStore
  implements IGoalPausedEventWriter, IGoalPausedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
