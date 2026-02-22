import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { UpdateDecisionRequest } from "../../../../../application/context/decisions/update/UpdateDecisionRequest.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Update an existing decision",
  category: "solution",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "Decision ID to update"
    }
  ],
  options: [
    {
      flags: "-t, --title <title>",
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
      command: "jumbo decision update --id dec_123 --title \"Use JWT with refresh tokens\"",
      description: "Update decision title"
    },
    {
      command: "jumbo decision update --id dec_123 --context \"Updated context\" --rationale \"Updated rationale\"",
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
    id: string;
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
    const request: UpdateDecisionRequest = {
      decisionId: options.id,
      title: options.title,
      context: options.context,
      rationale: options.rationale,
      alternatives: options.alternative,
      consequences: options.consequences
    };

    const response = await container.updateDecisionController.handle(request);

    // Success output - show what was updated
    const updatedFields: string[] = [];
    if (options.title) updatedFields.push('title');
    if (options.context) updatedFields.push('context');
    if (options.rationale) updatedFields.push('rationale');
    if (options.alternative) updatedFields.push('alternatives');
    if (options.consequences) updatedFields.push('consequences');

    renderer.success(`Decision updated (${response.decisionId})`);
    renderer.info(`Updated fields: ${updatedFields.join(', ')}`);
  } catch (error) {
    renderer.error("Failed to update decision", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
