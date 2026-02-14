/**
 * Command to resume the current worker's paused goal.
 * This is a parameterless command that automatically identifies
 * the worker's paused goal and resumes it.
 */
export interface ResumeWorkCommand {
  // Parameterless - worker identity is resolved from IWorkerIdentityReader
}
