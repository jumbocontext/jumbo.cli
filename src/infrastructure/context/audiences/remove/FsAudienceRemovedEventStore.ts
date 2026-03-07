/**
 * FsAudienceRemovedEventStore - File system event store for AudienceRemovedEvent event.
 *
 * Implements IAudienceRemovedEventWriter for persisting audience remove events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IAudienceRemovedEventWriter } from "../../../../application/context/audiences/remove/IAudienceRemovedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsAudienceRemovedEventStore
  extends FsEventStore
  implements IAudienceRemovedEventWriter
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
