/**
 * Validation rules for guideline enforcement field.
 */

import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  GuidelineErrorMessages,
  GuidelineLimits,
  formatErrorMessage,
} from "../Constants.js";

export class EnforcementRequiredRule implements ValidationRule<string> {
  validate(enforcement: string): ValidationResult {
    const isValid = !!(enforcement && enforcement.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [GuidelineErrorMessages.ENFORCEMENT_REQUIRED],
    };
  }
}

export class EnforcementMaxLengthRule implements ValidationRule<string> {
  constructor(
    private maxLength: number = GuidelineLimits.ENFORCEMENT_MAX_LENGTH
  ) {}

  validate(enforcement: string): ValidationResult {
    const isValid = enforcement.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(GuidelineErrorMessages.ENFORCEMENT_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const ENFORCEMENT_RULES = [
  new EnforcementRequiredRule(),
  new EnforcementMaxLengthRule(),
];
