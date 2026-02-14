/**
 * Port interface for listing invariants from the projection store.
 * Used by ListInvariantsQueryHandler to retrieve invariant list.
 */

import { InvariantView } from "../InvariantView.js";

export interface IInvariantListReader {
  /**
   * Retrieves all active invariants.
   * @returns Array of invariant views ordered by creation date
   */
  findAll(): Promise<InvariantView[]>;
}
