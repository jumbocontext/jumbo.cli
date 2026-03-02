import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IDecisionRestoredEventWriter } from "../../../../application/context/decisions/restore/IDecisionRestoredEventWriter.js";

export class FsDecisionRestoredEventStore
  extends FsEventStore
  implements IDecisionRestoredEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
