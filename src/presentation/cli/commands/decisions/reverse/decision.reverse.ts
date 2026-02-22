/**
 * CLI Command: jumbo decision reverse
 *
 * Reverses an architectural decision with a reason.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { ReverseDecisionRequest } from "../../../../../application/context/decisions/reverse/ReverseDecisionRequest.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Reverse an architectural decision",
  category: "solution",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "Decision ID to reverse"
    },
    {
      flags: "-r, --reason <reason>",
      description: "Reason for reversing the decision"
    }
  ],
  examples: [
    {
      command: "jumbo decision reverse --id dec_123 --reason \"Requirements changed\"",
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
    id: string;
    reason: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const request: ReverseDecisionRequest = {
      decisionId: options.id,
      reason: options.reason,
    };

    const response = await container.reverseDecisionController.handle(request);

    // Success output
    renderer.success(`Decision '${response.decisionId}' reversed`);
    renderer.info(`Reason: ${options.reason}`);
  } catch (error) {
    renderer.error("Failed to reverse decision", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
