/**
 * FsArchitectureDeprecatedEventStore - File system event store for ArchitectureDeprecated event.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IArchitectureDeprecatedEventWriter } from "../../../../application/context/architecture/deprecate/IArchitectureDeprecatedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsArchitectureDeprecatedEventStore
  extends FsEventStore
  implements IArchitectureDeprecatedEventWriter
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
