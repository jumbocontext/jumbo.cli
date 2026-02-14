/**
 * FsGoalUpdatedEventStore - File system event store for GoalUpdatedEvent.
 *
 * Implements IGoalUpdatedEventWriter and IGoalUpdatedEventReader for
 * persisting and reading goal update events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IGoalUpdatedEventWriter } from "../../../../application/context/goals/update/IGoalUpdatedEventWriter.js";
import { IGoalUpdatedEventReader } from "../../../../application/context/goals/update/IGoalUpdatedEventReader.js";

export class FsGoalUpdatedEventStore
  extends FsEventStore
  implements IGoalUpdatedEventWriter, IGoalUpdatedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
