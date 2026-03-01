import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IRelationDeactivatedEventWriter } from "../../../../application/context/relations/deactivate/IRelationDeactivatedEventWriter.js";
import { IRelationDeactivatedEventReader } from "../../../../application/context/relations/deactivate/IRelationDeactivatedEventReader.js";

export class FsRelationDeactivatedEventStore
  extends FsEventStore
  implements IRelationDeactivatedEventWriter, IRelationDeactivatedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
