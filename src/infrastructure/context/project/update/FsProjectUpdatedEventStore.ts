/**
 * FsProjectUpdatedEventStore - File system event store for ProjectUpdated event.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IProjectUpdatedEventWriter } from "../../../../application/context/project/update/IProjectUpdatedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsProjectUpdatedEventStore
  extends FsEventStore
  implements IProjectUpdatedEventWriter
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
