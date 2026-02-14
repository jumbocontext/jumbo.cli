/**
 * FsRelationRemovedEventStore - File system event store for RelationRemoved event.
 *
 * Implements IRelationRemovedEventWriter and IRelationRemovedEventReader for
 * persisting and reading relation remove events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IRelationRemovedEventWriter } from "../../../../application/context/relations/remove/IRelationRemovedEventWriter.js";
import { IRelationRemovedEventReader } from "../../../../application/context/relations/remove/IRelationRemovedEventReader.js";

export class FsRelationRemovedEventStore
  extends FsEventStore
  implements IRelationRemovedEventWriter, IRelationRemovedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
