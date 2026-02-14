/**
 * Port interface for reading value proposition state during remove.
 * Used to check if value proposition exists before remove.
 */

import { ValuePropositionView } from "../ValuePropositionView.js";
import { UUID } from "../../../../domain/BaseEvent.js";

export interface IValuePropositionRemoveReader {
  /**
   * Retrieves a value proposition view by ID.
   * Returns null if value proposition doesn't exist.
   */
  findById(id: UUID): Promise<ValuePropositionView | null>;
}
