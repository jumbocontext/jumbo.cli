/**
 * CLI Command: jumbo decision reverse
 *
 * Reverses an architectural decision with a reason.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { ReverseDecisionCommandHandler } from "../../../../../application/context/decisions/reverse/ReverseDecisionCommandHandler.js";
import { ReverseDecisionCommand } from "../../../../../application/context/decisions/reverse/ReverseDecisionCommand.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Reverse an architectural decision",
  category: "solution",
  requiredOptions: [
    {
      flags: "--decision-id <id>",
      description: "Decision ID to reverse"
    },
    {
      flags: "--reason <reason>",
      description: "Reason for reversing the decision"
    }
  ],
  examples: [
    {
      command: "jumbo decision reverse --decision-id dec_123 --reason \"Requirements changed\"",
      description: "Reverse a decision with reason"
    }
  ],
  related: ["decision add", "decision update", "decision supersede"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function decisionReverse(
  options: {
    decisionId: string;
    reason: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler using container dependencies
    const commandHandler = new ReverseDecisionCommandHandler(
      container.decisionReversedEventStore,
      container.decisionReversedProjector,
      container.eventBus
    );

    // 2. Execute command
    const command: ReverseDecisionCommand = {
      decisionId: options.decisionId,
      reason: options.reason
    };

    const result = await commandHandler.execute(command);

    // Success output
    renderer.success(`Decision '${result.decisionId}' reversed`);
    renderer.info(`Reason: ${options.reason}`);
  } catch (error) {
    renderer.error("Failed to reverse decision", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
