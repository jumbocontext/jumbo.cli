/**
 * AddInvariant Command
 *
 * Command to add a new invariant (non-negotiable requirement) to the project.
 */

export interface AddInvariantCommand {
  title: string;
  description: string;
  enforcement: string;
  rationale?: string;
}
