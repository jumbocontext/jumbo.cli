/**
 * CLI Command: jumbo dependency migrate
 *
 * Migrates legacy component-coupling dependencies into component relations.
 * Each legacy dependency (consumerId → providerId) becomes a component-to-component
 * relation with type "depends_on". The legacy dependency is then removed.
 *
 * Idempotent: running twice is safe (second run finds no active legacy dependencies).
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { MigrateDependenciesOutputBuilder } from "./MigrateDependenciesOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Migrate legacy component-coupling dependencies to relations",
  hidden: true,
  options: [
    {
      flags: "--dry-run",
      description: "Preview migration without making changes"
    }
  ],
  examples: [
    {
      command: "jumbo dependency migrate",
      description: "Convert all legacy component-coupling dependencies to relations"
    },
    {
      command: "jumbo dependency migrate --dry-run",
      description: "Preview what would be migrated without making changes"
    }
  ],
  related: ["dependency list", "relation add", "db rebuild"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function dependencyMigrate(
  options: { dryRun?: boolean },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new MigrateDependenciesOutputBuilder();

  try {
    const response = await container.migrateDependenciesCommandHandler.handle({
      dryRun: options.dryRun ?? false,
    });

    const output = outputBuilder.buildSuccess(response);
    renderer.info(output.toHumanReadable());
  } catch (error) {
    renderer.error("Failed to migrate dependencies", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
