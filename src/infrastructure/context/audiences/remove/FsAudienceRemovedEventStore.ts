/**
 * FsAudienceRemovedEventStore - File system event store for AudienceRemovedEvent event.
 *
 * Implements IAudienceRemovedEventWriter for persisting audience remove events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IAudienceRemovedEventWriter } from "../../../../application/context/audiences/remove/IAudienceRemovedEventWriter.js";

export class FsAudienceRemovedEventStore
  extends FsEventStore
  implements IAudienceRemovedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
