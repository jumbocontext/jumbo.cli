/**
 * FsAudiencePainUpdatedEventStore - File system event store for AudiencePainUpdated event.
 *
 * Implements IAudiencePainUpdatedEventWriter for persisting audience pain update events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IAudiencePainUpdatedEventWriter } from "../../../../application/context/audience-pains/update/IAudiencePainUpdatedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsAudiencePainUpdatedEventStore
  extends FsEventStore
  implements IAudiencePainUpdatedEventWriter
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
