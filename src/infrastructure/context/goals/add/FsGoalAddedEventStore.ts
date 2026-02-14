/**
 * FsGoalAddedEventStore - File system event store for GoalAddedEvent.
 *
 * Implements IGoalAddedEventWriter for persisting goal addition events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IGoalAddedEventWriter } from "../../../../application/context/goals/add/IGoalAddedEventWriter.js";

export class FsGoalAddedEventStore
  extends FsEventStore
  implements IGoalAddedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
