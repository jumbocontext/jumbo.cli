/**
 * CLI Command: jumbo decision supersede
 *
 * Marks an existing decision as superseded by a newer decision.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Mark a decision as superseded by a newer decision",
  category: "solution",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the decision to supersede"
    },
    {
      flags: "--superseded-by <id>",
      description: "ID of the superseding decision"
    }
  ],
  examples: [
    {
      command: "jumbo decision supersede --id dec_123 --superseded-by dec_456",
      description: "Mark a decision as superseded by another"
    }
  ],
  related: ["decision add", "decision reverse", "decision update"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function decisionSupersede(
  options: {
    id: string;
    supersededBy: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.supersedeDecisionController.handle({
      decisionId: options.id,
      supersededBy: options.supersededBy,
    });

    renderer.success(`Decision '${response.decisionId}' superseded by '${options.supersededBy}'`);
  } catch (error) {
    renderer.error("Failed to supersede decision", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
