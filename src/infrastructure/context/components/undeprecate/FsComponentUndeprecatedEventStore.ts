import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IComponentUndeprecatedEventWriter } from "../../../../application/context/components/undeprecate/IComponentUndeprecatedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";

export class FsComponentUndeprecatedEventStore
  extends FsEventStore
  implements IComponentUndeprecatedEventWriter
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
