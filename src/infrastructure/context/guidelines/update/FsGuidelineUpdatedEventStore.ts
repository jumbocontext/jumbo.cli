/**
 * FsGuidelineUpdatedEventStore - File system event store for GuidelineUpdated event.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IGuidelineUpdatedEventWriter } from "../../../../application/context/guidelines/update/IGuidelineUpdatedEventWriter.js";
import { IGuidelineUpdatedEventReader } from "../../../../application/context/guidelines/update/IGuidelineUpdatedEventReader.js";

export class FsGuidelineUpdatedEventStore
  extends FsEventStore
  implements IGuidelineUpdatedEventWriter, IGuidelineUpdatedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
