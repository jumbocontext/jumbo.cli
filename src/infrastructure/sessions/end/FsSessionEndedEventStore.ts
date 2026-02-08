/**
 * FsSessionEndedEventStore - File system event store for SessionEnded event.
 *
 * Implements ISessionEndedEventWriter and ISessionEndedEventReader for
 * persisting and reading session end events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../persistence/FsEventStore.js";
import { ISessionEndedEventWriter } from "../../../application/sessions/end/ISessionEndedEventWriter.js";
import { ISessionEndedEventReader } from "../../../application/sessions/end/ISessionEndedEventReader.js";

export class FsSessionEndedEventStore
  extends FsEventStore
  implements ISessionEndedEventWriter, ISessionEndedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
