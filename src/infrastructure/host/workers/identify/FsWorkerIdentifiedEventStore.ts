/**
 * FsWorkerIdentifiedEventStore - File system event store for WorkerIdentifiedEvent.
 *
 * Implements IWorkerIdentifiedEventWriter for persisting worker identified events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IWorkerIdentifiedEventWriter } from "../../../../application/host/workers/identify/IWorkerIdentifiedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsWorkerIdentifiedEventStore
  extends FsEventStore
  implements IWorkerIdentifiedEventWriter
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
