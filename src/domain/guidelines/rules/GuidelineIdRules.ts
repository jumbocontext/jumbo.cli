/**
 * Validation rules for Guideline ID.
 * Ensures guideline ID is provided.
 */

import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import { GuidelineErrorMessages } from "../Constants.js";

export class GuidelineIdRequiredRule implements ValidationRule<string> {
  validate(id: string): ValidationResult {
    const isValid = !!(id && id.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [GuidelineErrorMessages.ID_REQUIRED],
    };
  }
}

export const GUIDELINE_ID_RULES = [new GuidelineIdRequiredRule()];
