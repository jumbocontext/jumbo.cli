/**
 * FsComponentAddedEventStore - File system event store for ComponentAdded event.
 *
 * Implements IComponentAddedEventWriter for persisting component add events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IComponentAddedEventWriter } from "../../../../application/context/components/add/IComponentAddedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsComponentAddedEventStore
  extends FsEventStore
  implements IComponentAddedEventWriter
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
