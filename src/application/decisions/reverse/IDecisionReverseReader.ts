/**
 * Port interface for reading decision data needed for reverse operations.
 * Infrastructure layer will implement this.
 */

import { DecisionView } from "../DecisionView.js";

export interface IDecisionReverseReader {
  /**
   * Find a decision by ID for reverse operations.
   */
  findById(id: string): Promise<DecisionView | null>;
}
