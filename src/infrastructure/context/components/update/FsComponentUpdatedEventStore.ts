/**
 * FsComponentUpdatedEventStore - File system event store for ComponentUpdated event.
 *
 * Implements IComponentUpdatedEventWriter for persisting component update events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IComponentUpdatedEventWriter } from "../../../../application/context/components/update/IComponentUpdatedEventWriter.js";

export class FsComponentUpdatedEventStore
  extends FsEventStore
  implements IComponentUpdatedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
