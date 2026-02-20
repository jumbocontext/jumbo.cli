/**
 * PauseWorkResponse - Result of pausing work.
 *
 * Contains the paused goal's identity and status information.
 */
export interface PauseWorkResponse {
  readonly goalId: string;
  readonly objective: string;
}
