/**
 * Port interface for reading audience pains in query contexts.
 * Used by SessionContextQueryHandler for session orientation.
 */

import { AudiencePainView } from "../AudiencePainView.js";

export interface IAudiencePainContextReader {
  /**
   * Retrieves all active (non-resolved) audience pains.
   * @returns Array of active audience pain views
   */
  findAllActive(): Promise<AudiencePainView[]>;
}
