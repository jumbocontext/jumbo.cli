/**
 * AddGuidelineCommand
 *
 * Command to add a new execution guideline to the project.
 */

import { GuidelineCategoryValue } from "../../../../domain/guidelines/Constants.js";

export interface AddGuidelineCommand {
  readonly category: GuidelineCategoryValue;
  readonly title: string;
  readonly description: string;
  readonly rationale: string;
  readonly enforcement: string;
  readonly examples?: string[];
}
