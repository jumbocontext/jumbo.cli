/**
 * UpdateGuidelineCommand
 *
 * Command to update an existing guideline.
 * Supports partial updates - only provided fields are changed.
 */

import { GuidelineCategoryValue } from "../../../../domain/guidelines/Constants.js";

export interface UpdateGuidelineCommand {
  readonly id: string;
  readonly category?: GuidelineCategoryValue;
  readonly title?: string;
  readonly description?: string;
  readonly rationale?: string;
  readonly enforcement?: string;
  readonly examples?: string[];
}
