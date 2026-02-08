/**
 * Domain constants for Goal aggregate.
 * Centralizes event types, status values, error messages, and limits.
 */

// Goal event types
export const GoalEventType = {
  ADDED: 'GoalAddedEvent',
  STARTED: 'GoalStartedEvent',
  UPDATED: 'GoalUpdatedEvent',
  BLOCKED: 'GoalBlockedEvent',
  UNBLOCKED: 'GoalUnblockedEvent',
  PAUSED: 'GoalPausedEvent',
  RESUMED: 'GoalResumedEvent',
  COMPLETED: 'GoalCompletedEvent',
  RESET: 'GoalResetEvent',
  REMOVED: 'GoalRemovedEvent',
  PROGRESS_UPDATED: 'GoalProgressUpdatedEvent',
  SUBMITTED_FOR_REVIEW: 'GoalSubmittedForReviewEvent',
  QUALIFIED: 'GoalQualifiedEvent'
} as const;

export type GoalEventTypeValue = typeof GoalEventType[keyof typeof GoalEventType];

// Goal status enum
export const GoalStatus = {
  TODO: 'to-do',
  DOING: 'doing',
  BLOCKED: 'blocked',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  INREVIEW: 'in-review',
  QUALIFIED: 'qualified',
} as const;

export type GoalStatusType = typeof GoalStatus[keyof typeof GoalStatus];

// Error messages
export const GoalErrorMessages = {
  ALREADY_DEFINED: 'Goal has already been defined',
  OBJECTIVE_REQUIRED: 'Goal objective must be provided',
  OBJECTIVE_TOO_LONG: 'Objective must be less than {max} characters',
  SUCCESS_CRITERIA_REQUIRED: 'At least one success criterion must be provided',
  SUCCESS_CRITERION_TOO_LONG: 'Success criterion must be less than {max} characters',
  TOO_MANY_CRITERIA: 'Cannot have more than {max} success criteria',
  SCOPE_ITEM_TOO_LONG: 'Scope item must be less than {max} characters',
  TOO_MANY_SCOPE_ITEMS: 'Cannot have more than {max} scope items',
  GOAL_NOT_FOUND: 'Goal not found: {id}',
  CANNOT_START_BLOCKED: 'Cannot start a blocked goal. Unblock it first.',
  CANNOT_START_COMPLETED: 'Cannot start a completed goal.',
  NOT_FOUND: 'Goal with ID {goalId} not found',
  NO_CHANGES_PROVIDED: 'At least one field must be provided for update',
  CANNOT_UPDATE_COMPLETED: 'Cannot update a completed goal',
  NOTE_REQUIRED: 'Note is required when blocking a goal',
  NOTE_TOO_LONG: 'Note must be less than {max} characters',
  CANNOT_BLOCK_IN_STATUS: 'Cannot block goal in {status} status. Goal must be in to-do or doing status.',
  CANNOT_UNBLOCK_IN_STATUS: 'Cannot unblock goal in {status} status. Goal must be blocked.',
  NOT_QUALIFIED: 'Cannot complete goal. Goal must be qualified first.',
  ALREADY_COMPLETED: 'Goal is already completed',
  QA_REVIEW_REQUIRED: 'At least one QA review is required before committing goal {goalId}.',
  CANNOT_RESET_BLOCKED: 'Cannot reset a blocked goal. Unblock it first to preserve blocker context.',
  ALREADY_TODO: 'Goal is already in to-do status',
  CANNOT_PAUSE_IN_STATUS: 'Cannot pause goal in {status} status. Goal must be in doing status.',
  CANNOT_RESUME_IN_STATUS: 'Cannot resume goal in {status} status. Goal must be paused.',
  // Embedded context: file path errors
  FILE_PATH_TOO_LONG: 'File path must be less than {max} characters',
  // Claim-related errors
  GOAL_CLAIMED_BY_ANOTHER_WORKER: 'Goal is claimed by another worker. Claim expires at {expiresAt}.',
  // Review and qualification state transition errors
  CANNOT_SUBMIT_FOR_REVIEW_IN_STATUS: 'Cannot submit goal for review in {status} status. Goal must be in doing or blocked status.',
  CANNOT_QUALIFY_IN_STATUS: 'Cannot qualify goal in {status} status. Goal must be in-review.',
} as const;

// Numeric limits
export const GoalLimits = {
  OBJECTIVE_MAX_LENGTH: 500,
  SUCCESS_CRITERION_MAX_LENGTH: 600,
  MAX_SUCCESS_CRITERIA: 50,
  SCOPE_ITEM_MAX_LENGTH: 200,
  MAX_SCOPE_ITEMS: 20,
  NOTE_MAX_LENGTH: 500,
  // Embedded context: file path limits (only validation needed - other fields pre-validated by source aggregates)
  FILE_PATH_MAX_LENGTH: 500
} as const;

// Helper function for message formatting
export function formatErrorMessage(
  template: string,
  replacements: Record<string, string | number>
): string {
  return Object.entries(replacements).reduce(
    (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
    template
  );
}
