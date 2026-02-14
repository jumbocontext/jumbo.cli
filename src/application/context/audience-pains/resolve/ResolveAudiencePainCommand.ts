/**
 * ResolveAudiencePain Command
 *
 * Command to mark an audience pain point as resolved.
 */

export interface ResolveAudiencePainCommand {
  painId: string;
  resolutionNotes?: string;
}
