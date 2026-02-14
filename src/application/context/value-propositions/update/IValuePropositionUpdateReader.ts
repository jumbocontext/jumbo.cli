/**
 * Port interface for reading value proposition state during update.
 * Used to check if value proposition exists before update.
 */

import { ValuePropositionView } from "../ValuePropositionView.js";
import { UUID } from "../../../../domain/BaseEvent.js";

export interface IValuePropositionUpdateReader {
  /**
   * Retrieves a value proposition view by ID.
   * Returns null if value proposition doesn't exist.
   */
  findById(id: UUID): Promise<ValuePropositionView | null>;
}
