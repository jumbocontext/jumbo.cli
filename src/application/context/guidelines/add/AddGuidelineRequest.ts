import { GuidelineCategoryValue } from "../../../../domain/guidelines/Constants.js";

export interface AddGuidelineRequest {
  readonly category: GuidelineCategoryValue;
  readonly title: string;
  readonly description: string;
  readonly rationale: string;
  readonly enforcement: string;
  readonly examples?: string[];
}
