/**
 * CLI Command: jumbo dependencies list
 *
 * Lists all registered dependencies with optional filtering.
 *
 * Usage:
 *   jumbo dependencies list
 *   jumbo dependencies list --ecosystem npm
 *   jumbo dependencies list --package-name express --format json
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { DependencyListOutputBuilder } from "./DependencyListOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "List third-party dependencies (packages/services)",
  category: "solution",
  options: [
    {
      flags: "--name <name>",
      description: "Filter by dependency display name",
    },
    {
      flags: "--ecosystem <ecosystem>",
      description: "Filter by ecosystem",
    },
    {
      flags: "--package-name <packageName>",
      description: "Filter by package name",
    },
    {
      flags: "--consumer <componentId>",
      description: "Legacy filter (deprecated, removed in v3.0.0): former consumer component ID",
    },
    {
      flags: "--provider <componentId>",
      description: "Legacy filter (deprecated, removed in v3.0.0): former provider component ID",
    },
  ],
  examples: [
    {
      command: "jumbo dependencies list",
      description: "List all dependencies",
    },
    {
      command: "jumbo dependencies list --ecosystem npm",
      description: "List external dependencies from npm",
    },
    {
      command: "jumbo dependencies list --consumer comp_123 --provider comp_456 --format json",
      description: "Legacy compatibility filter for historical coupling records (deprecated, removed in v3.0.0)",
    },
  ],
  related: ["dependency add", "dependency update", "dependency remove", "relation list"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function dependenciesList(
  options: { name?: string; ecosystem?: string; packageName?: string; consumer?: string; provider?: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // Build filter from options
    const filter = {
      name: options.name,
      ecosystem: options.ecosystem,
      packageName: options.packageName,
      consumer: options.consumer,
      provider: options.provider,
    };

    // Delegate to controller
    const { dependencies } = await container.getDependenciesController.handle({ filter });

    if (dependencies.length === 0) {
      const filterParts: string[] = [];
      if (filter.name) filterParts.push(`name '${filter.name}'`);
      if (filter.ecosystem) filterParts.push(`ecosystem '${filter.ecosystem}'`);
      if (filter.packageName) filterParts.push(`package '${filter.packageName}'`);
      if (filter.consumer) filterParts.push(`consumer '${filter.consumer}'`);
      if (filter.provider) filterParts.push(`provider '${filter.provider}'`);
      const filterMsg = filterParts.length > 0 ? ` for ${filterParts.join(" and ")}` : "";
      renderer.info(`No dependencies found${filterMsg}. Use 'jumbo dependency add' to add one.`);
      return;
    }

    // Check if we're in structured output mode by examining renderer config
    const config = renderer.getConfig();

    const filterParts: string[] = [];
    if (filter.name) filterParts.push(`name: ${filter.name}`);
    if (filter.ecosystem) filterParts.push(`ecosystem: ${filter.ecosystem}`);
    if (filter.packageName) filterParts.push(`packageName: ${filter.packageName}`);
    if (filter.consumer) filterParts.push(`consumer: ${filter.consumer}`);
    if (filter.provider) filterParts.push(`provider: ${filter.provider}`);
    const filterLabel = filterParts.length > 0 ? filterParts.join(", ") : "all";

    const outputBuilder = new DependencyListOutputBuilder();
    if (config.format === "text") {
      const output = outputBuilder.build(dependencies, filterLabel);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(dependencies, filterLabel);
      const sections = output.getSections();
      const dataSection = sections.find(s => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error("Failed to list dependencies", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
