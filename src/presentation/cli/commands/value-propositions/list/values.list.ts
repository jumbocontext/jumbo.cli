/**
 * CLI Command: jumbo values list
 *
 * Lists all value propositions for the project.
 *
 * Usage:
 *   jumbo values list
 *   jumbo values list --format json
 *   jumbo values list --format yaml
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { ValuePropositionView } from "../../../../../application/context/value-propositions/ValuePropositionView.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "List all value propositions for the project",
  category: "project-knowledge",
  examples: [
    {
      command: "jumbo values list",
      description: "List all value propositions in text format",
    },
    {
      command: "jumbo values list --format json",
      description: "List all value propositions as JSON",
    },
    {
      command: "jumbo values list --format yaml",
      description: "List all value propositions as YAML",
    },
  ],
  related: ["value add", "value update", "value remove"],
};

/**
 * Format value proposition for text output
 */
function formatValueText(value: ValuePropositionView): void {
  console.log(`${value.title}`);
  console.log(`  ${value.description}`);
  console.log(`  Benefit: ${value.benefit}`);
  if (value.measurableOutcome) {
    console.log(`  Outcome: ${value.measurableOutcome}`);
  }
  console.log(`  ID: ${value.valuePropositionId}`);
  console.log("");
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function valuesList(
  _options: Record<string, never>,
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const { values } = await container.getValuePropositionsController.handle({});

    if (values.length === 0) {
      renderer.info("No value propositions defined yet. Use 'jumbo value add' to add one.");
      return;
    }

    // Check if we're in structured output mode by examining renderer config
    const config = renderer.getConfig();

    if (config.format === "text") {
      // Text format: human-readable output
      console.log(`\nValue Propositions (${values.length}):\n`);
      for (const value of values) {
        formatValueText(value);
      }
    } else {
      // Structured format (json/yaml/ndjson): use renderer.data()
      const data = {
        count: values.length,
        values: values.map((v) => ({
          valuePropositionId: v.valuePropositionId,
          title: v.title,
          description: v.description,
          benefit: v.benefit,
          measurableOutcome: v.measurableOutcome,
          createdAt: v.createdAt,
          updatedAt: v.updatedAt,
        })),
      };
      renderer.data(data);
    }
  } catch (error) {
    renderer.error("Failed to list value propositions", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
