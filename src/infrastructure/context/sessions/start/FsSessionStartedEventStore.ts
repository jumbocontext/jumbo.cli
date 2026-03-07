/**
 * FsSessionStartedEventStore - File system event store for SessionStarted event.
 *
 * Implements ISessionStartedEventWriter for persisting session start events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { ISessionStartedEventWriter } from "../../../../application/context/sessions/start/ISessionStartedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsSessionStartedEventStore
  extends FsEventStore
  implements ISessionStartedEventWriter
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
