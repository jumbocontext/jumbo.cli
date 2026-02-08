/**
 * Port interface for reading decision data needed for update operations.
 * Infrastructure layer will implement this.
 */

import { DecisionView } from "../DecisionView.js";

export interface IDecisionUpdateReader {
  /**
   * Find a decision by ID for update operations.
   */
  findById(id: string): Promise<DecisionView | null>;
}
