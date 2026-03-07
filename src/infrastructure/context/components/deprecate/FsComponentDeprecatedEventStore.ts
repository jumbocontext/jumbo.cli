/**
 * FsComponentDeprecatedEventStore - File system event store for ComponentDeprecated event.
 *
 * Implements IComponentDeprecatedEventWriter for persisting component deprecate events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IComponentDeprecatedEventWriter } from "../../../../application/context/components/deprecate/IComponentDeprecatedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsComponentDeprecatedEventStore
  extends FsEventStore
  implements IComponentDeprecatedEventWriter
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
