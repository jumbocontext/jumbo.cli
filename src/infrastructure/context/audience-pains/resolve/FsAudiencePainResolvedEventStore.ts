/**
 * FsAudiencePainResolvedEventStore - File system event store for AudiencePainResolved event.
 *
 * Implements IAudiencePainResolvedEventWriter for persisting audience pain resolve events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IAudiencePainResolvedEventWriter } from "../../../../application/context/audience-pains/resolve/IAudiencePainResolvedEventWriter.js";

export class FsAudiencePainResolvedEventStore
  extends FsEventStore
  implements IAudiencePainResolvedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
