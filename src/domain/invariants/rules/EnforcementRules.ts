/**
 * Validation rules for invariant enforcement field.
 */

import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  InvariantErrorMessages,
  InvariantLimits,
  formatErrorMessage,
} from "../Constants.js";

export class EnforcementRequiredRule implements ValidationRule<string> {
  validate(enforcement: string): ValidationResult {
    const isValid = !!(enforcement && enforcement.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [InvariantErrorMessages.ENFORCEMENT_REQUIRED],
    };
  }
}

export class EnforcementMaxLengthRule implements ValidationRule<string> {
  constructor(
    private maxLength: number = InvariantLimits.ENFORCEMENT_MAX_LENGTH
  ) {}

  validate(enforcement: string): ValidationResult {
    const isValid = enforcement.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(InvariantErrorMessages.ENFORCEMENT_TOO_LONG, {
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
