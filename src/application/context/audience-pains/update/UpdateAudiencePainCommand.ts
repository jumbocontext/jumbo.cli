/**
 * UpdateAudiencePain Command
 *
 * Command to update an existing audience pain's details (title and/or description).
 */

export interface UpdateAudiencePainCommand {
  readonly painId: string;
  readonly title?: string;
  readonly description?: string;
}
