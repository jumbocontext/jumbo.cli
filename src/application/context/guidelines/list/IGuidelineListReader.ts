/**
 * Port interface for listing guidelines from the projection store.
 * Used by ListGuidelinesQueryHandler to retrieve guideline list with filtering.
 */

import { GuidelineView } from "../GuidelineView.js";

export interface IGuidelineListReader {
  /**
   * Retrieves all active guidelines, optionally filtered by category.
   * @param category - Optional filter by category
   * @returns Array of guideline views ordered by category and creation date
   */
  findAll(category?: string): Promise<GuidelineView[]>;
}
