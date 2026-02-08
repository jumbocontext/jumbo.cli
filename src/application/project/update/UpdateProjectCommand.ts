/**
 * UpdateProject Command
 *
 * Command to update an existing project's metadata.
 * Only specified fields will be updated (partial update support).
 */

export interface UpdateProjectCommand {
  readonly purpose?: string | null;
  readonly boundaries?: string[];
}
