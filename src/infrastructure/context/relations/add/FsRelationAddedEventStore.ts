/**
 * FsRelationAddedEventStore - File system event store for RelationAdded event.
 *
 * Implements IRelationAddedEventWriter for persisting relation add events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IRelationAddedEventWriter } from "../../../../application/context/relations/add/IRelationAddedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsRelationAddedEventStore
  extends FsEventStore
  implements IRelationAddedEventWriter
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
