/**
 * FsGuidelineAddedEventStore - File system event store for GuidelineAdded event.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IGuidelineAddedEventWriter } from "../../../../application/context/guidelines/add/IGuidelineAddedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsGuidelineAddedEventStore
  extends FsEventStore
  implements IGuidelineAddedEventWriter
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
