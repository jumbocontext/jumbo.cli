/**
 * GetInvariantsQueryHandler - Query handler for listing project invariants.
 *
 * This is a standard CQRS query handler that provides read access to
 * the Invariant projection for listing purposes.
 */

import { IInvariantViewReader } from "./IInvariantViewReader.js";
import { InvariantView } from "../InvariantView.js";

export class GetInvariantsQueryHandler {
  constructor(
    private readonly invariantViewReader: IInvariantViewReader
  ) {}

  async execute(): Promise<InvariantView[]> {
    return this.invariantViewReader.findAll();
  }
}
