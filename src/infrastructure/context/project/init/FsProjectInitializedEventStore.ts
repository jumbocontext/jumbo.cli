/**
 * FsProjectInitializedEventStore - File system event store for ProjectInitialized event.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IProjectInitializedEventWriter } from "../../../../application/context/project/init/IProjectInitializedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsProjectInitializedEventStore
  extends FsEventStore
  implements IProjectInitializedEventWriter
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
