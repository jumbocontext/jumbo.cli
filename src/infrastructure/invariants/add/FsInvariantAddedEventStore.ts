/**
 * FsInvariantAddedEventStore - File system event store for InvariantAdded event.
 */

import { FsEventStore } from "../../persistence/FsEventStore.js";
import { IInvariantAddedEventWriter } from "../../../application/invariants/add/IInvariantAddedEventWriter.js";

export class FsInvariantAddedEventStore
  extends FsEventStore
  implements IInvariantAddedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
