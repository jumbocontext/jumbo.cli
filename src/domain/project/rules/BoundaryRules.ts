/**
 * Validation rules for project boundaries field.
 */

import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  ProjectErrorMessages,
  ProjectLimits,
  formatErrorMessage,
} from "../Constants.js";

export class BoundariesMaxCountRule implements ValidationRule<string[]> {
  constructor(
    private maxCount: number = ProjectLimits.MAX_BOUNDARIES
  ) {}

  validate(boundaries: string[]): ValidationResult {
    const isValid = boundaries.length <= this.maxCount;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(ProjectErrorMessages.TOO_MANY_BOUNDARIES, {
              max: this.maxCount,
            }),
          ],
    };
  }
}

export class BoundaryItemMaxLengthRule implements ValidationRule<string[]> {
  constructor(
    private maxLength: number = ProjectLimits.BOUNDARY_MAX_LENGTH
  ) {}

  validate(boundaries: string[]): ValidationResult {
    const errors: string[] = [];

    for (const boundary of boundaries) {
      if (boundary.length > this.maxLength) {
        errors.push(
          formatErrorMessage(ProjectErrorMessages.BOUNDARY_TOO_LONG, {
            max: this.maxLength,
          })
        );
        break; // Only report once
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const BOUNDARY_RULES = [
  new BoundariesMaxCountRule(),
  new BoundaryItemMaxLengthRule(),
];
