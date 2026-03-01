import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IRelationReactivatedEventWriter } from "../../../../application/context/relations/reactivate/IRelationReactivatedEventWriter.js";
import { IRelationReactivatedEventReader } from "../../../../application/context/relations/reactivate/IRelationReactivatedEventReader.js";

export class FsRelationReactivatedEventStore
  extends FsEventStore
  implements IRelationReactivatedEventWriter, IRelationReactivatedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
