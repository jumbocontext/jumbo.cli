/**
 * FsAudienceAddedEventStore - File system event store for AudienceAddedEvent event.
 *
 * Implements IAudienceAddedEventWriter for persisting audience add events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IAudienceAddedEventWriter } from "../../../../application/context/audiences/add/IAudienceAddedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsAudienceAddedEventStore
  extends FsEventStore
  implements IAudienceAddedEventWriter
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
