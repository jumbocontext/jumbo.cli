/**
 * Port interface for projecting ValuePropositionAddedEvent events.
 * Infrastructure layer will implement this.
 */

import { ValuePropositionAddedEvent } from "../../../../domain/value-propositions/add/ValuePropositionAddedEvent.js";

export interface IValuePropositionAddedProjector {
  /**
   * Applies a ValuePropositionAddedEvent event to update the materialized view.
   */
  applyValuePropositionAdded(event: ValuePropositionAddedEvent): Promise<void>;
}
