/**
 * Port interface for reading value propositions in query contexts.
 * Used by list queries for displaying all value propositions.
 */

import { ValuePropositionView } from "../ValuePropositionView.js";

export interface IValuePropositionContextReader {
  /**
   * Retrieves all active (non-removed) value propositions.
   * @returns Array of active value proposition views
   */
  findAllActive(): Promise<ValuePropositionView[]>;
}
