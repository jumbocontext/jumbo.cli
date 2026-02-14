/**
 * FsArchitectureDefinedEventStore - File system event store for ArchitectureDefined event.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IArchitectureDefinedEventWriter } from "../../../../application/context/architecture/define/IArchitectureDefinedEventWriter.js";

export class FsArchitectureDefinedEventStore
  extends FsEventStore
  implements IArchitectureDefinedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
