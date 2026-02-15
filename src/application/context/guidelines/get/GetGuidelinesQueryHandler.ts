/**
 * GetGuidelinesQueryHandler - Query handler for listing execution guidelines.
 *
 * This is a standard CQRS query handler that provides read access to
 * the Guideline projection for listing purposes with optional filtering.
 */

import { IGuidelineViewReader } from "./IGuidelineViewReader.js";
import { GuidelineView } from "../GuidelineView.js";

export class GetGuidelinesQueryHandler {
  constructor(
    private readonly guidelineViewReader: IGuidelineViewReader
  ) {}

  async execute(category?: string): Promise<GuidelineView[]> {
    return this.guidelineViewReader.findAll(category);
  }
}
