/**
 * FsDependencyUpdatedEventStore - File system event store for DependencyUpdated event.
 *
 * Implements IDependencyUpdatedEventWriter and IDependencyUpdatedEventReader
 * for persisting and reading dependency update events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IDependencyUpdatedEventWriter } from "../../../../application/context/dependencies/update/IDependencyUpdatedEventWriter.js";
import { IDependencyUpdatedEventReader } from "../../../../application/context/dependencies/update/IDependencyUpdatedEventReader.js";

export class FsDependencyUpdatedEventStore
  extends FsEventStore
  implements IDependencyUpdatedEventWriter, IDependencyUpdatedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
