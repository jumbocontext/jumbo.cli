/**
 * FsGoalBlockedEventStore - File system event store for GoalBlockedEvent.
 *
 * Implements IGoalBlockedEventWriter and IGoalBlockedEventReader for
 * persisting and reading goal blocked events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IGoalBlockedEventWriter } from "../../../../application/context/goals/block/IGoalBlockedEventWriter.js";
import { IGoalBlockedEventReader } from "../../../../application/context/goals/block/IGoalBlockedEventReader.js";

export class FsGoalBlockedEventStore
  extends FsEventStore
  implements IGoalBlockedEventWriter, IGoalBlockedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
