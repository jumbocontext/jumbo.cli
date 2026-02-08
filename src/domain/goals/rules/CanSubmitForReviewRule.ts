import { ValidationRule, ValidationResult } from "../../validation/ValidationRule.js";
import { GoalState } from "../Goal.js";
import { GoalStatus, GoalErrorMessages, formatErrorMessage } from "../Constants.js";

/**
 * Validates that a goal can be submitted for review.
 * A goal can only be submitted for review if it's in 'doing' or 'blocked' status.
 * Cannot submit a goal that is in 'to-do', 'paused', 'completed', 'in-review', or 'qualified' status.
 */
export class CanSubmitForReviewRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    // Valid statuses to submit for review from: DOING, BLOCKED
    const validStatuses: string[] = [GoalStatus.DOING, GoalStatus.BLOCKED];
    const isValid = validStatuses.includes(state.status);

    return {
      isValid,
      errors: isValid
        ? []
        : [formatErrorMessage(
            GoalErrorMessages.CANNOT_SUBMIT_FOR_REVIEW_IN_STATUS,
            { status: state.status }
          )],
    };
  }
}
