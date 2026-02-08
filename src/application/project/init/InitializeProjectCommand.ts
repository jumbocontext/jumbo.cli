/**
 * InitializeProject Command
 *
 * Command to initialize a new Jumbo project.
 */

export interface InitializeProjectCommand {
  name: string;
  purpose?: string;
  boundaries?: string[];
}
