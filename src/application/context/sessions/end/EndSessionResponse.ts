export interface EndSessionResponse {
  readonly sessionId: string;
  readonly focus: string;
  readonly summary?: string;
}
