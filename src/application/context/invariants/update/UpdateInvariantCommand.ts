/**
 * UpdateInvariant Command
 *
 * Command to update an existing invariant's properties.
 * At least one field must be provided.
 */

export interface UpdateInvariantCommand {
  invariantId: string;
  title?: string;
  description?: string;
  rationale?: string | null;
  enforcement?: string;
}
