/**
 * Port interface for reading decision data needed for supersede operations.
 * Infrastructure layer will implement this.
 */

import { DecisionView } from "../DecisionView.js";

export interface IDecisionSupersedeReader {
  /**
   * Find a decision by ID for supersede operations.
   */
  findById(id: string): Promise<DecisionView | null>;
}
