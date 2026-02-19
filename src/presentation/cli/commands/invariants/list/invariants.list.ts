/**
 * CLI Command: jumbo invariants list
 *
 * Lists all project invariants.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { InvariantView } from "../../../../../application/context/invariants/InvariantView.js";

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

function formatInvariantText(invariant: InvariantView): void {
  console.log(`${invariant.title}`);
  console.log(`  ${invariant.description}`);
  console.log(`  ID: ${invariant.invariantId}`);
  console.log("");
}

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

    if (config.format === "text") {
      console.log(`\nInvariants (${invariants.length}):\n`);
      for (const invariant of invariants) {
        formatInvariantText(invariant);
      }
    } else {
      const data = {
        count: invariants.length,
        invariants: invariants.map((i) => ({
          invariantId: i.invariantId,
          title: i.title,
          description: i.description,
          rationale: i.rationale,
          enforcement: i.enforcement,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt,
        })),
      };
      renderer.data(data);
    }
  } catch (error) {
    renderer.error("Failed to list invariants", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
