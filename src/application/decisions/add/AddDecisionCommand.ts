/**
 * Command to add a new architectural decision record (ADR).
 */
export interface AddDecisionCommand {
  readonly title: string;
  readonly context: string;
  readonly rationale?: string;
  readonly alternatives?: string[];
  readonly consequences?: string;
}
