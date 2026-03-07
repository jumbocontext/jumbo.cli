import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IDecisionRestoredEventWriter } from "../../../../application/context/decisions/restore/IDecisionRestoredEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsDecisionRestoredEventStore
  extends FsEventStore
  implements IDecisionRestoredEventWriter
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
