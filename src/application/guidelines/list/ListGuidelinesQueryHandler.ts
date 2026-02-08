/**
 * ListGuidelinesQueryHandler - Query handler for listing execution guidelines.
 *
 * This is a standard CQRS query handler that provides read access to
 * the Guideline projection for listing purposes with optional filtering.
 */

import { IGuidelineListReader } from "./IGuidelineListReader.js";
import { GuidelineView } from "../GuidelineView.js";

export class ListGuidelinesQueryHandler {
  constructor(
    private readonly guidelineListReader: IGuidelineListReader
  ) {}

  async execute(category?: string): Promise<GuidelineView[]> {
    return this.guidelineListReader.findAll(category);
  }
}
