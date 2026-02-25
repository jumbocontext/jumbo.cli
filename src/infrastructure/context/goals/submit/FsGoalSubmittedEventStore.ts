/**
 * FsGoalSubmittedEventStore - File system event store for GoalSubmittedEvent.
 *
 * Implements IGoalSubmittedEventWriter and IGoalSubmittedEventReader for
 * persisting and reading goal submitted events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IGoalSubmittedEventWriter } from "../../../../application/context/goals/submit/IGoalSubmittedEventWriter.js";
import { IGoalSubmittedEventReader } from "../../../../application/context/goals/submit/IGoalSubmittedEventReader.js";

export class FsGoalSubmittedEventStore
  extends FsEventStore
  implements IGoalSubmittedEventWriter, IGoalSubmittedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
