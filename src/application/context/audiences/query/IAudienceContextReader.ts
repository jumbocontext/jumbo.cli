/**
 * Port interface for reading audiences in query contexts.
 * Used by SessionContextQueryHandler for session orientation.
 */

import { AudienceView } from "../AudienceView.js";

export interface IAudienceContextReader {
  /**
   * Retrieves all active (non-removed) audiences.
   * @returns Array of active audience views
   */
  findAllActive(): Promise<AudienceView[]>;
}
