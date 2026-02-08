/**
 * Command to update an existing decision.
 *
 * Supports partial updates - any combination of fields can be updated.
 * Only active decisions (not reversed or superseded) can be updated.
 */
export interface UpdateDecisionCommand {
  /**
   * Decision ID to update
   */
  readonly decisionId: string;

  /**
   * Updated decision title (optional)
   */
  readonly title?: string;

  /**
   * Updated decision context (optional)
   */
  readonly context?: string;

  /**
   * Updated decision rationale (optional)
   */
  readonly rationale?: string;

  /**
   * Updated alternatives considered (optional)
   * If provided, replaces existing alternatives array
   */
  readonly alternatives?: string[];

  /**
   * Updated consequences (optional)
   */
  readonly consequences?: string;
}
