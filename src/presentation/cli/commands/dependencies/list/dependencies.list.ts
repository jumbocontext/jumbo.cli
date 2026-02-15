/**
 * CLI Command: jumbo dependencies list
 *
 * Lists all component dependencies with optional filtering.
 *
 * Usage:
 *   jumbo dependencies list
 *   jumbo dependencies list --consumer UserService
 *   jumbo dependencies list --provider DatabaseService --format json
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { GetDependenciesQueryHandler } from "../../../../../application/context/dependencies/get/GetDependenciesQueryHandler.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { DependencyView } from "../../../../../application/context/dependencies/DependencyView.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "List all component dependencies",
  category: "solution",
  options: [
    {
      flags: "--consumer <componentId>",
      description: "Filter by consumer component ID",
    },
    {
      flags: "--provider <componentId>",
      description: "Filter by provider component ID",
    },
  ],
  examples: [
    {
      command: "jumbo dependencies list",
      description: "List all dependencies",
    },
    {
      command: "jumbo dependencies list --consumer comp_123",
      description: "List dependencies where comp_123 is the consumer",
    },
    {
      command: "jumbo dependencies list --provider comp_456 --format json",
      description: "List dependencies where comp_456 is the provider as JSON",
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
  console.log(`${formatStatus(dep.status)} ${dep.consumerId} -> ${dep.providerId}`);
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
  options: { consumer?: string; provider?: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // Build filter from options
    const filter = {
      consumer: options.consumer,
      provider: options.provider,
    };

    // Create query handler using container dependencies
    const queryHandler = new GetDependenciesQueryHandler(
      container.dependencyViewReader
    );

    // Execute query
    const dependencies = await queryHandler.execute(filter);

    if (dependencies.length === 0) {
      const filterParts: string[] = [];
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
          consumer: filter.consumer ?? null,
          provider: filter.provider ?? null,
        },
        dependencies: dependencies.map((d) => ({
          dependencyId: d.dependencyId,
          consumerId: d.consumerId,
          providerId: d.providerId,
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
