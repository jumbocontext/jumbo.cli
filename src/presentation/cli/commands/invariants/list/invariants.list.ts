/**
 * CLI Command: jumbo invariants list
 *
 * Lists all project invariants.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { InvariantListOutputBuilder } from "./InvariantListOutputBuilder.js";

export const metadata: CommandMetadata = {
  description: "List all project invariants",
  category: "solution",
  options: [],
  examples: [
    { command: "jumbo invariants list", description: "List all invariants" },
    { command: "jumbo invariants list --format json", description: "List invariants as JSON" },
  ],
  related: ["invariant add", "invariant update", "invariant remove"],
};

export async function invariantsList(
  options: Record<string, never>,
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const { invariants } = await container.getInvariantsController.getAllInvariants({});

    if (invariants.length === 0) {
      renderer.info("No invariants found. Use 'jumbo invariant add' to add one.");
      return;
    }

    const config = renderer.getConfig();

    const outputBuilder = new InvariantListOutputBuilder();
    if (config.format === "text") {
      const output = outputBuilder.build(invariants);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(invariants);
      const sections = output.getSections();
      const dataSection = sections.find(s => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error("Failed to list invariants", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
