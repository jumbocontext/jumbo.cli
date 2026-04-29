export interface UpdateInvariantRequest {
  readonly invariantId: string;
  readonly title?: string;
  readonly description?: string;
  readonly rationale?: string;
}
