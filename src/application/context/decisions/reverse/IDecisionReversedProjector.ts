/**
 * Port interface for projecting DecisionReversed events.
 * Infrastructure layer will implement this.
 */

import { DecisionReversedEvent } from "../../../../domain/decisions/reverse/DecisionReversedEvent.js";

export interface IDecisionReversedProjector {
  /**
   * Applies a DecisionReversed event to update the materialized view.
   */
  applyDecisionReversed(event: DecisionReversedEvent): Promise<void>;
}
