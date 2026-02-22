/**
 * CLI Command: jumbo component show
 *
 * Displays a component's full details and all relations where the
 * component is either source or target.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { ComponentShowOutputBuilder } from "./ComponentShowOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Display component details and relations",
  category: "solution",
  options: [
    {
      flags: "-i, --id <componentId>",
      description: "ID of the component to show",
    },
    {
      flags: "-n, --name <name>",
      description: "Name of the component to show",
    },
  ],
  examples: [
    {
      command: 'jumbo component show --name "AddComponentCommandHandler"',
      description: "Show component by name",
    },
    {
      command: "jumbo component show --id comp_abc123",
      description: "Show component by ID",
    },
  ],
  related: ["component add", "component update", "components list"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function componentShow(
  options: { id?: string; name?: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // Validate that at least one identifier is provided
    if (!options.id && !options.name) {
      renderer.error("Either --id or --name is required");
      process.exit(1);
    }

    const result = await container.showComponentController.handle({
      componentId: options.id,
      name: options.name,
    });

    // Build and render output using builder pattern
    const outputBuilder = new ComponentShowOutputBuilder();
    if (process.stdout.isTTY) {
      const output = outputBuilder.build(result.component, result.relations);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(result.component, result.relations);
      const sections = output.getSections();
      const dataSection = sections.find(s => s.type === 'data');
      if (dataSection) {
        renderer.data(dataSection.content as Record<string, unknown>);
      }
    }

  } catch (error) {
    if (error instanceof Error && error.message.includes("Component not found")) {
      const identifier = options.id || options.name || "unknown";
      renderer.error("Component not found", `No component exists with ID or name: ${identifier}`);
      process.exit(1);
    }

    renderer.error("Failed to show component", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
