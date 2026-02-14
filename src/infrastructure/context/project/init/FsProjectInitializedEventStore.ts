/**
 * FsProjectInitializedEventStore - File system event store for ProjectInitialized event.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IProjectInitializedEventWriter } from "../../../../application/context/project/init/IProjectInitializedEventWriter.js";

export class FsProjectInitializedEventStore
  extends FsEventStore
  implements IProjectInitializedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
