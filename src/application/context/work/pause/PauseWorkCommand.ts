/**
 * Command to pause the current worker's active goal.
 * This is a parameterless command that automatically identifies
 * the worker's active goal and pauses it.
 */
export interface PauseWorkCommand {
  // Parameterless - worker identity is resolved from IWorkerIdentityReader
}
