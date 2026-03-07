/**
 * FsInvariantAddedEventStore - File system event store for InvariantAdded event.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IInvariantAddedEventWriter } from "../../../../application/context/invariants/add/IInvariantAddedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsInvariantAddedEventStore
  extends FsEventStore
  implements IInvariantAddedEventWriter
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
