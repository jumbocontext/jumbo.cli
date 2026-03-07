/**
 * FsAudiencePainAddedEventStore - File system event store for AudiencePainAdded event.
 *
 * Implements IAudiencePainAddedEventWriter for persisting audience pain add events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IAudiencePainAddedEventWriter } from "../../../../application/context/audience-pains/add/IAudiencePainAddedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsAudiencePainAddedEventStore
  extends FsEventStore
  implements IAudiencePainAddedEventWriter
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
