/**
 * Port interface for projecting DecisionSuperseded events.
 * Infrastructure layer will implement this.
 */

import { DecisionSupersededEvent } from "../../../../domain/decisions/supersede/DecisionSupersededEvent.js";

export interface IDecisionSupersededProjector {
  /**
   * Applies a DecisionSuperseded event to update the materialized view.
   */
  applyDecisionSuperseded(event: DecisionSupersededEvent): Promise<void>;
}
