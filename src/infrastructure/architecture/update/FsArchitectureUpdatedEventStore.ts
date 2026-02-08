/**
 * FsArchitectureUpdatedEventStore - File system event store for ArchitectureUpdated event.
 */

import { FsEventStore } from "../../persistence/FsEventStore.js";
import { IArchitectureUpdatedEventWriter } from "../../../application/architecture/update/IArchitectureUpdatedEventWriter.js";
import { IArchitectureUpdatedEventReader } from "../../../application/architecture/update/IArchitectureUpdatedEventReader.js";

export class FsArchitectureUpdatedEventStore
  extends FsEventStore
  implements IArchitectureUpdatedEventWriter, IArchitectureUpdatedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
