import { ValidationRule, ValidationResult } from "../../validation/ValidationRule.js";
import { GoalState } from "../Goal.js";
import { GoalStatus, GoalErrorMessages, formatErrorMessage } from "../Constants.js";

/**
 * Validates that a goal can be qualified.
 * A goal can only be qualified if it's in 'in-review' status.
 * Cannot qualify a goal that is in any other status.
 */
export class CanQualifyRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    // Valid status to qualify from: IN-REVIEW only
    const isValid = state.status === GoalStatus.INREVIEW;

    return {
      isValid,
      errors: isValid
        ? []
        : [formatErrorMessage(
            GoalErrorMessages.CANNOT_QUALIFY_IN_STATUS,
            { status: state.status }
          )],
    };
  }
}
