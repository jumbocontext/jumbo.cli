/**
 * FsDependencyAddedEventStore - File system event store for DependencyAdded event.
 *
 * Implements IDependencyAddedEventWriter for persisting dependency add events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IDependencyAddedEventWriter } from "../../../../application/context/dependencies/add/IDependencyAddedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsDependencyAddedEventStore
  extends FsEventStore
  implements IDependencyAddedEventWriter
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
