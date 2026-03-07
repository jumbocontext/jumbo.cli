/**
 * FsArchitectureDefinedEventStore - File system event store for ArchitectureDefined event.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IArchitectureDefinedEventWriter } from "../../../../application/context/architecture/define/IArchitectureDefinedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsArchitectureDefinedEventStore
  extends FsEventStore
  implements IArchitectureDefinedEventWriter
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
