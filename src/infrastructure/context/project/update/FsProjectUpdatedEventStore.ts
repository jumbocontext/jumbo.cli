/**
 * FsProjectUpdatedEventStore - File system event store for ProjectUpdated event.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IProjectUpdatedEventWriter } from "../../../../application/context/project/update/IProjectUpdatedEventWriter.js";

export class FsProjectUpdatedEventStore
  extends FsEventStore
  implements IProjectUpdatedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
