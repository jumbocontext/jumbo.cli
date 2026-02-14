/**
 * Port interface for listing decisions from the projection store.
 * Used by ListDecisionsQueryHandler to retrieve decision list with filtering.
 */

import { DecisionView } from "../DecisionView.js";

export type DecisionStatusFilter = "active" | "superseded" | "reversed" | "all";

export interface IDecisionListReader {
  /**
   * Retrieves all decisions, optionally filtered by status.
   * @param status - Filter by status, or "all" for all decisions
   * @returns Array of decision views ordered by creation date (newest first)
   */
  findAll(status?: DecisionStatusFilter): Promise<DecisionView[]>;
}
