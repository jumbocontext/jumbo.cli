/**
 * FsInvariantRemovedEventStore - File system event store for InvariantRemoved event.
 */

import { FsEventStore } from "../../persistence/FsEventStore.js";
import { IInvariantRemovedEventWriter } from "../../../application/invariants/remove/IInvariantRemovedEventWriter.js";
import { IInvariantRemovedEventReader } from "../../../application/invariants/remove/IInvariantRemovedEventReader.js";

export class FsInvariantRemovedEventStore
  extends FsEventStore
  implements IInvariantRemovedEventWriter, IInvariantRemovedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
