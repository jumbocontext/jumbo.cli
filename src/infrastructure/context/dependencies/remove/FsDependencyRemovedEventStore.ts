/**
 * FsDependencyRemovedEventStore - File system event store for DependencyRemoved event.
 *
 * Implements IDependencyRemovedEventWriter and IDependencyRemovedEventReader
 * for persisting and reading dependency remove events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IDependencyRemovedEventWriter } from "../../../../application/context/dependencies/remove/IDependencyRemovedEventWriter.js";
import { IDependencyRemovedEventReader } from "../../../../application/context/dependencies/remove/IDependencyRemovedEventReader.js";

export class FsDependencyRemovedEventStore
  extends FsEventStore
  implements IDependencyRemovedEventWriter, IDependencyRemovedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
