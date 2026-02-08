import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { UpdateDecisionCommandHandler } from "../../../../../application/decisions/update/UpdateDecisionCommandHandler.js";
import { UpdateDecisionCommand } from "../../../../../application/decisions/update/UpdateDecisionCommand.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Update an existing decision",
  category: "solution",
  requiredOptions: [
    {
      flags: "--decision-id <id>",
      description: "Decision ID to update"
    }
  ],
  options: [
    {
      flags: "--title <title>",
      description: "Updated decision title"
    },
    {
      flags: "--context <context>",
      description: "Updated decision context"
    },
    {
      flags: "--rationale <rationale>",
      description: "Updated decision rationale"
    },
    {
      flags: "--alternative <items...>",
      description: "Alternatives considered (can specify multiple)"
    },
    {
      flags: "--consequences <consequences>",
      description: "Updated consequences"
    }
  ],
  examples: [
    {
      command: "jumbo decision update --decision-id dec_123 --title \"Use JWT with refresh tokens\"",
      description: "Update decision title"
    },
    {
      command: "jumbo decision update --decision-id dec_123 --context \"Updated context\" --rationale \"Updated rationale\"",
      description: "Update multiple fields"
    }
  ],
  related: ["decision add", "decision reverse", "decision supersede"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function decisionUpdate(
  options: {
    decisionId: string;
    title?: string;
    context?: string;
    rationale?: string;
    alternative?: string[];
    consequences?: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler using container dependencies
    const commandHandler = new UpdateDecisionCommandHandler(
      container.decisionUpdatedEventStore,
      container.decisionUpdatedProjector,
      container.eventBus
    );

    // 2. Execute command
    const command: UpdateDecisionCommand = {
      decisionId: options.decisionId,
      title: options.title,
      context: options.context,
      rationale: options.rationale,
      alternatives: options.alternative,
      consequences: options.consequences
    };

    const result = await commandHandler.execute(command);

    // Success output - show what was updated
    const updatedFields: string[] = [];
    if (options.title) updatedFields.push('title');
    if (options.context) updatedFields.push('context');
    if (options.rationale) updatedFields.push('rationale');
    if (options.alternative) updatedFields.push('alternatives');
    if (options.consequences) updatedFields.push('consequences');

    renderer.success(`Decision updated (${result.decisionId})`);
    renderer.info(`Updated fields: ${updatedFields.join(', ')}`);
  } catch (error) {
    renderer.error("Failed to update decision", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
