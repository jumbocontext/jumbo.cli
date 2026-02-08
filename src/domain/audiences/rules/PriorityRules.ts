/**
 * Priority validation rules for Audience aggregate
 */

import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  AudienceErrorMessages,
  AudiencePriority,
  AudiencePriorityType,
} from "../Constants.js";

export class PriorityValidRule implements ValidationRule<AudiencePriorityType> {
  validate(priority: AudiencePriorityType): ValidationResult {
    const validPriorities = Object.values(AudiencePriority);
    const isValid = validPriorities.includes(priority);
    return {
      isValid,
      errors: isValid ? [] : [AudienceErrorMessages.INVALID_PRIORITY],
    };
  }
}

export const PRIORITY_RULES = [new PriorityValidRule()];
