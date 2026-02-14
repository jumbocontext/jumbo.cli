/**
 * CLI Command: jumbo decision add
 *
 * Adds a new architectural decision record (ADR) to track strategic choices
 * made during system design with their rationale, alternatives, and consequences.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { AddDecisionCommandHandler } from "../../../../../application/context/decisions/add/AddDecisionCommandHandler.js";
import { AddDecisionCommand } from "../../../../../application/context/decisions/add/AddDecisionCommand.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Add a new architectural decision record (ADR)",
  category: "solution",
  requiredOptions: [
    {
      flags: "--title <title>",
      description: "Decision title",
    },
    {
      flags: "--context <context>",
      description: "Context and problem statement",
    },
  ],
  options: [
    {
      flags: "--rationale <text>",
      description: "Rationale for the decision",
    },
    {
      flags: "--alternative <items...>",
      description: "Alternatives considered (can specify multiple)",
    },
    {
      flags: "--consequences <text>",
      description: "Consequences of this decision",
    },
  ],
  examples: [
    {
      command:
        'jumbo decision add --title "Use JWT tokens" --context "Need stateless auth"',
      description: "Add a decision with title and context",
    },
    {
      command:
        'jumbo decision add --title "Use JWT" --context "Need auth" --rationale "Scalable" --alternative "Sessions" --alternative "OAuth2"',
      description: "Add decision with alternatives",
    },
  ],
  related: ["decision update", "decision reverse", "decision supersede"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function decisionAdd(
  options: {
    title: string;
    context: string;
    rationale?: string;
    alternative?: string[];
    consequences?: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler using container dependencies
    const commandHandler = new AddDecisionCommandHandler(
      container.decisionAddedEventStore,
      container.eventBus
    );

    // 2. Execute command
    const command: AddDecisionCommand = {
      title: options.title,
      context: options.context,
      rationale: options.rationale,
      alternatives: options.alternative,
      consequences: options.consequences,
    };

    const result = await commandHandler.execute(command);

    // Success output
    renderer.success(`Decision '${options.title}' added (${result.decisionId})`);
    if (options.rationale) {
      const preview =
        options.rationale.length > 100
          ? options.rationale.substring(0, 100) + "..."
          : options.rationale;
      renderer.info(`Rationale: ${preview}`);
    }
  } catch (error) {
    renderer.error("Failed to add decision", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
