import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IComponentUndeprecatedEventWriter } from "../../../../application/context/components/undeprecate/IComponentUndeprecatedEventWriter.js";

export class FsComponentUndeprecatedEventStore
  extends FsEventStore
  implements IComponentUndeprecatedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
