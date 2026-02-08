/**
 * Command to update an existing value proposition
 */
export interface UpdateValuePropositionCommand {
  readonly id: string;
  readonly title?: string;
  readonly description?: string;
  readonly benefit?: string;
  readonly measurableOutcome?: string | null; // null means "clear the field"
}
