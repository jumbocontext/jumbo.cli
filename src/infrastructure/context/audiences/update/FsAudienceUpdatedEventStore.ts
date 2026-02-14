/**
 * FsAudienceUpdatedEventStore - File system event store for AudienceUpdatedEvent event.
 *
 * Implements IAudienceUpdatedEventWriter for persisting audience update events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IAudienceUpdatedEventWriter } from "../../../../application/context/audiences/update/IAudienceUpdatedEventWriter.js";

export class FsAudienceUpdatedEventStore
  extends FsEventStore
  implements IAudienceUpdatedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
