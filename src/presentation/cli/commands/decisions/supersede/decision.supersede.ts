/**
 * CLI Command: jumbo decision supersede
 *
 * Marks an existing decision as superseded by a newer decision.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { SupersedeDecisionCommandHandler } from "../../../../../application/decisions/supersede/SupersedeDecisionCommandHandler.js";
import { SupersedeDecisionCommand } from "../../../../../application/decisions/supersede/SupersedeDecisionCommand.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Mark a decision as superseded by a newer decision",
  category: "solution",
  requiredOptions: [
    {
      flags: "--decision-id <id>",
      description: "ID of the decision to supersede"
    },
    {
      flags: "--superseded-by <id>",
      description: "ID of the superseding decision"
    }
  ],
  examples: [
    {
      command: "jumbo decision supersede --decision-id dec_123 --superseded-by dec_456",
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
    decisionId: string;
    supersededBy: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler using container dependencies
    const commandHandler = new SupersedeDecisionCommandHandler(
      container.decisionSupersededEventStore,
      container.decisionSupersededProjector,
      container.eventBus
    );

    // 2. Execute command
    const command: SupersedeDecisionCommand = {
      decisionId: options.decisionId,
      supersededBy: options.supersededBy
    };

    const result = await commandHandler.execute(command);

    // Success output
    renderer.success(`Decision '${result.decisionId}' superseded by '${options.supersededBy}'`);
  } catch (error) {
    renderer.error("Failed to supersede decision", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
