/**
 * Command to add a new value proposition to the project
 */
export interface AddValuePropositionCommand {
  readonly title: string;
  readonly description: string;
  readonly benefit: string;
  readonly measurableOutcome?: string;
}
