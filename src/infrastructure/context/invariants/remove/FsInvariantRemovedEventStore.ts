/**
 * FsInvariantRemovedEventStore - File system event store for InvariantRemoved event.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IInvariantRemovedEventWriter } from "../../../../application/context/invariants/remove/IInvariantRemovedEventWriter.js";
import { IInvariantRemovedEventReader } from "../../../../application/context/invariants/remove/IInvariantRemovedEventReader.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsInvariantRemovedEventStore
  extends FsEventStore
  implements IInvariantRemovedEventWriter, IInvariantRemovedEventReader
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
