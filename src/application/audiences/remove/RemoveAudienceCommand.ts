/**
 * RemoveAudience Command
 *
 * Command to remove an existing audience from the project.
 */

export interface RemoveAudienceCommand {
  readonly audienceId: string;
  readonly reason?: string; // Optional reason for removal
}
