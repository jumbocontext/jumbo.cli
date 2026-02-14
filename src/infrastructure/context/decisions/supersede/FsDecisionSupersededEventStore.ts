/**
 * FsDecisionSupersededEventStore - File system event store for DecisionSuperseded event.
 *
 * Implements IDecisionSupersededEventWriter for persisting decision supersede events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../persistence/FsEventStore.js";
import { IDecisionSupersededEventWriter } from "../../../../application/context/decisions/supersede/IDecisionSupersededEventWriter.js";

export class FsDecisionSupersededEventStore
  extends FsEventStore
  implements IDecisionSupersededEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
