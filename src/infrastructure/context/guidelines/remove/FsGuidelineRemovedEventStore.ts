/**
 * FsGuidelineRemovedEventStore - File system event store for GuidelineRemoved event.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IGuidelineRemovedEventWriter } from "../../../../application/context/guidelines/remove/IGuidelineRemovedEventWriter.js";
import { IGuidelineRemovedEventReader } from "../../../../application/context/guidelines/remove/IGuidelineRemovedEventReader.js";

export class FsGuidelineRemovedEventStore
  extends FsEventStore
  implements IGuidelineRemovedEventWriter, IGuidelineRemovedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
