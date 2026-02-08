/**
 * CLI Command: jumbo audience-pain resolve
 *
 * Marks an audience pain point as resolved.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { ResolveAudiencePainCommandHandler } from "../../../../../application/audience-pains/resolve/ResolveAudiencePainCommandHandler.js";
import { ResolveAudiencePainCommand } from "../../../../../application/audience-pains/resolve/ResolveAudiencePainCommand.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Mark an audience pain point as resolved",
  category: "project-knowledge",
  requiredOptions: [
    {
      flags: "--pain-id <painId>",
      description: "ID of the pain point to resolve",
    },
  ],
  options: [
    {
      flags: "--notes <notes>",
      description: "Optional resolution notes",
    },
  ],
  examples: [
    {
      command: 'jumbo audience-pain resolve --pain-id pain_abc123',
      description: "Mark a pain point as resolved",
    },
    {
      command: 'jumbo audience-pain resolve --pain-id pain_abc123 --notes "Resolved by implementing feature X"',
      description: "Mark a pain point as resolved with notes",
    },
  ],
  related: ["audience-pain add", "audience-pain update", "audience add"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function audiencePainResolve(options: {
  painId: string;
  notes?: string;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler using container dependencies
    const commandHandler = new ResolveAudiencePainCommandHandler(
      container.audiencePainResolvedEventStore,
      container.eventBus
    );

    // 2. Execute command
    const command: ResolveAudiencePainCommand = {
      painId: options.painId,
      resolutionNotes: options.notes,
    };

    await commandHandler.execute(command);

    // 3. Fetch updated view for display
    const view = await container.audiencePainUpdatedProjector.findById(options.painId);

    // Success output
    const data: Record<string, string> = {
      painId: options.painId,
    };

    if (view) {
      data.title = view.title;
      data.status = view.status;
      data.resolvedAt = view.resolvedAt || "N/A";
    }

    renderer.success(`Audience pain marked as resolved.`, data);
  } catch (error) {
    renderer.error("Failed to resolve audience pain", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
