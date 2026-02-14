import { InvariantView } from "../InvariantView.js";

/**
 * Port interface for reading invariant data needed during add operations.
 * Used by AddInvariantCommandHandler to check for duplicate titles.
 */
export interface IInvariantAddReader {
  findByTitle(title: string): Promise<InvariantView | null>;
}
