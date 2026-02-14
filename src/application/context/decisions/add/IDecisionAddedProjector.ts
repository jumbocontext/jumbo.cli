/**
 * Port interface for projecting DecisionAdded events.
 * Infrastructure layer will implement this.
 */

import { DecisionAddedEvent } from "../../../../domain/decisions/add/DecisionAddedEvent.js";

export interface IDecisionAddedProjector {
  /**
   * Applies a DecisionAdded event to update the materialized view.
   */
  applyDecisionAdded(event: DecisionAddedEvent): Promise<void>;
}
