export interface UpdateValuePropositionRequest {
  readonly id: string;
  readonly title?: string;
  readonly description?: string;
  readonly benefit?: string;
  readonly measurableOutcome?: string | null;
}
