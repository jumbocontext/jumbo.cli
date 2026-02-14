/**
 * FsGoalRemovedEventStore - File system event store for GoalRemovedEvent.
 *
 * Implements IGoalRemovedEventWriter and IGoalRemovedEventReader for
 * persisting and reading goal removed events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IGoalRemovedEventWriter } from "../../../../application/context/goals/remove/IGoalRemovedEventWriter.js";
import { IGoalRemovedEventReader } from "../../../../application/context/goals/remove/IGoalRemovedEventReader.js";

export class FsGoalRemovedEventStore
  extends FsEventStore
  implements IGoalRemovedEventWriter, IGoalRemovedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
