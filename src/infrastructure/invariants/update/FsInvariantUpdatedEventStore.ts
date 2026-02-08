/**
 * FsInvariantUpdatedEventStore - File system event store for InvariantUpdated event.
 */

import { FsEventStore } from "../../persistence/FsEventStore.js";
import { IInvariantUpdatedEventWriter } from "../../../application/invariants/update/IInvariantUpdatedEventWriter.js";
import { IInvariantUpdatedEventReader } from "../../../application/invariants/update/IInvariantUpdatedEventReader.js";

export class FsInvariantUpdatedEventStore
  extends FsEventStore
  implements IInvariantUpdatedEventWriter, IInvariantUpdatedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
