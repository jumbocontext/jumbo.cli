/**
 * CLI Command: jumbo architecture show
 *
 * Alias for viewing the current architecture definition.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { architectureView } from "../view/architecture.view.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Show current project architecture",
  category: "solution",
  examples: [
    {
      command: "jumbo architecture show",
      description: "Show the current architecture definition"
    }
  ],
  related: ["architecture define", "architecture update", "architecture view"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function architectureShow(
  options: Record<string, never>,
  container: IApplicationContainer
) {
  return architectureView(options, container);
}
