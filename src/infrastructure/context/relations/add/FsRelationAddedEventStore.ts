/**
 * FsRelationAddedEventStore - File system event store for RelationAdded event.
 *
 * Implements IRelationAddedEventWriter for persisting relation add events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IRelationAddedEventWriter } from "../../../../application/context/relations/add/IRelationAddedEventWriter.js";

export class FsRelationAddedEventStore
  extends FsEventStore
  implements IRelationAddedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
