/**
 * ListInvariantsQueryHandler - Query handler for listing project invariants.
 *
 * This is a standard CQRS query handler that provides read access to
 * the Invariant projection for listing purposes.
 */

import { IInvariantListReader } from "./IInvariantListReader.js";
import { InvariantView } from "../InvariantView.js";

export class ListInvariantsQueryHandler {
  constructor(
    private readonly invariantListReader: IInvariantListReader
  ) {}

  async execute(): Promise<InvariantView[]> {
    return this.invariantListReader.findAll();
  }
}
