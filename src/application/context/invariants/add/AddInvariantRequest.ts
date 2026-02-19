export interface AddInvariantRequest {
  readonly title: string;
  readonly description: string;
  readonly enforcement: string;
  readonly rationale?: string;
}
