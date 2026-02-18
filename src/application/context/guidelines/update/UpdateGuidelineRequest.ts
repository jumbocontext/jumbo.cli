import { GuidelineCategoryValue } from "../../../../domain/guidelines/Constants.js";

export interface UpdateGuidelineRequest {
  readonly id: string;
  readonly category?: GuidelineCategoryValue;
  readonly title?: string;
  readonly description?: string;
  readonly rationale?: string;
  readonly enforcement?: string;
  readonly examples?: string[];
}
