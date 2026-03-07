/**
 * FsInvariantUpdatedEventStore - File system event store for InvariantUpdated event.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IInvariantUpdatedEventWriter } from "../../../../application/context/invariants/update/IInvariantUpdatedEventWriter.js";
import { IInvariantUpdatedEventReader } from "../../../../application/context/invariants/update/IInvariantUpdatedEventReader.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsInvariantUpdatedEventStore
  extends FsEventStore
  implements IInvariantUpdatedEventWriter, IInvariantUpdatedEventReader
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
