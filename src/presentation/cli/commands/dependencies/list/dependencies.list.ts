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
import { DependencyView } from "../../../../../application/context/dependencies/DependencyView.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "List dependencies",
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
      description: "Legacy filter (compatibility): former consumer component ID",
    },
    {
      flags: "--provider <componentId>",
      description: "Legacy filter (compatibility): former provider component ID",
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
      description: "Legacy compatibility filter for historical coupling records",
    },
  ],
  related: ["dependency add", "dependency update", "dependency remove"],
};

/**
 * Format status for display
 */
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: "[ACTIVE]",
    removed: "[REMOVED]",
  };
  return statusMap[status] || `[${status.toUpperCase()}]`;
}

/**
 * Format dependency for text output
 */
function formatDependencyText(dep: DependencyView): void {
  const version = dep.versionConstraint ? `@${dep.versionConstraint}` : "";
  console.log(`${formatStatus(dep.status)} ${dep.ecosystem}:${dep.packageName}${version} (${dep.name})`);
  if (dep.endpoint) {
    console.log(`  Endpoint: ${dep.endpoint}`);
  }
  if (dep.contract) {
    console.log(`  Contract: ${dep.contract}`);
  }
  if (dep.removalReason) {
    console.log(`  Removal reason: ${dep.removalReason}`);
  }
  console.log(`  ID: ${dep.dependencyId}`);
  console.log("");
}

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

    if (config.format === "text") {
      // Text format: human-readable output
      const filterParts: string[] = [];
      if (filter.name) filterParts.push(`name: ${filter.name}`);
      if (filter.ecosystem) filterParts.push(`ecosystem: ${filter.ecosystem}`);
      if (filter.packageName) filterParts.push(`packageName: ${filter.packageName}`);
      if (filter.consumer) filterParts.push(`consumer: ${filter.consumer}`);
      if (filter.provider) filterParts.push(`provider: ${filter.provider}`);
      const filterLabel = filterParts.length > 0 ? ` (${filterParts.join(", ")})` : "";
      console.log(`\nDependencies${filterLabel} (${dependencies.length}):\n`);
      for (const dep of dependencies) {
        formatDependencyText(dep);
      }
    } else {
      // Structured format (json/yaml/ndjson): use renderer.data()
      const data = {
        count: dependencies.length,
        filter: {
          name: filter.name ?? null,
          ecosystem: filter.ecosystem ?? null,
          packageName: filter.packageName ?? null,
          consumer: filter.consumer ?? null,
          provider: filter.provider ?? null,
        },
        dependencies: dependencies.map((d) => ({
          dependencyId: d.dependencyId,
          name: d.name,
          ecosystem: d.ecosystem,
          packageName: d.packageName,
          versionConstraint: d.versionConstraint,
          endpoint: d.endpoint,
          contract: d.contract,
          status: d.status,
          removedAt: d.removedAt,
          removalReason: d.removalReason,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        })),
      };
      renderer.data(data);
    }
  } catch (error) {
    renderer.error("Failed to list dependencies", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
