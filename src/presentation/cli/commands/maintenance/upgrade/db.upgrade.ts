/**
 * CLI Command: jumbo db upgrade (alias: jumbo upgrade)
 *
 * Migrates goal event streams from v1 to v2 status naming.
 * Appends GoalStatusMigratedEvent for goals with legacy status values:
 *   'to-do'     → 'defined'
 *   'qualified'  → 'approved'
 *   'completed'  → 'done'
 *
 * Idempotent: running twice is safe (second run finds no legacy statuses).
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { UpgradeOutputBuilder } from "./UpgradeOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Upgrade event store to v2 status naming",
  hidden: true,
  requiredOptions: [
    {
      flags: "--from <version>",
      description: "Source version (e.g., v1)"
    },
    {
      flags: "--to <version>",
      description: "Target version (e.g., v2)"
    }
  ],
  options: [],
  examples: [
    {
      command: "jumbo upgrade --from v1 --to v2",
      description: "Migrate goal statuses to v2 naming"
    }
  ],
  related: ["db rebuild"],
  topLevelAliases: ["upgrade"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function dbUpgrade(
  options: { from: string; to: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new UpgradeOutputBuilder();

  try {
    const response = await container.upgradeCommandHandler.handle({
      from: options.from,
      to: options.to,
    });

    const output = outputBuilder.buildSuccess(response);
    renderer.info(output.toHumanReadable());
  } catch (error) {
    renderer.error("Failed to upgrade", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
