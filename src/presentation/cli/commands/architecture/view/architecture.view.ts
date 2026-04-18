/**
 * CLI Command: jumbo architecture view
 *
 * Displays the current architecture definition with deprecation notice.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import {
  ARCHITECTURE_DEPRECATION_NOTICE,
  ARCHITECTURE_MIGRATION_TABLE,
} from "../../../../../application/context/architecture/ArchitectureDeprecationConstants.js";
import { Colors, Symbols } from "../../../rendering/StyleConfig.js";
import { heading, metaField, contentLine, divider } from "../../../rendering/OutputLayout.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "View current project architecture (deprecated)",
  category: "solution",
  examples: [
    {
      command: "jumbo architecture view",
      description: "Show the current architecture definition"
    }
  ],
  related: ["decision add", "invariant add", "component add", "dependency add"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function architectureView(
  options: Record<string, never>,
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const { architecture } = await container.getArchitectureController.handle({});

    if (!architecture) {
      renderer.info("No architecture defined.");
      return;
    }

    const config = renderer.getConfig();

    if (config.format === "text") {
      const lines: string[] = [];
      lines.push("");
      lines.push(heading("Architecture"));
      lines.push("");
      lines.push(metaField("ID", Colors.muted(architecture.architectureId), 14));
      lines.push(metaField("Description", Colors.primary(architecture.description), 14));
      lines.push(metaField("Organization", Colors.primary(architecture.organization), 14));
      lines.push(metaField("Version", Colors.muted(String(architecture.version)), 14));
      lines.push(metaField("Created", Colors.muted(architecture.createdAt), 14));
      lines.push(metaField("Updated", Colors.muted(architecture.updatedAt), 14));

      if (architecture.patterns.length > 0) {
        lines.push(metaField("Patterns", Colors.primary(architecture.patterns.join(", ")), 14));
      }
      if (architecture.principles.length > 0) {
        lines.push(metaField("Principles", Colors.primary(architecture.principles.join(", ")), 14));
      }
      if (architecture.stack.length > 0) {
        lines.push(metaField("Stack", Colors.primary(architecture.stack.join(", ")), 14));
      }
      if (architecture.dataStores.length > 0) {
        lines.push("");
        lines.push(heading("Data Stores"));
        for (const dataStore of architecture.dataStores) {
          lines.push(contentLine(`${Colors.primary(dataStore.name)} ${Colors.muted(`(${dataStore.type})`)}: ${dataStore.purpose}`));
        }
      }

      lines.push("");
      lines.push(divider());
      lines.push(contentLine(`${Symbols.warning} ${Colors.warning(ARCHITECTURE_DEPRECATION_NOTICE)}`));
      lines.push(contentLine("Migrate to individual entities:"));
      for (const tableLine of ARCHITECTURE_MIGRATION_TABLE.split("\n")) {
        lines.push(contentLine(tableLine));
      }
      lines.push("");
      renderer.info(lines.join("\n"));
    } else {
      renderer.data({ architecture });
    }
  } catch (error) {
    renderer.error("Failed to view architecture", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
