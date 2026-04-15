/**
 * CLI Command: jumbo architecture update
 *
 * DEPRECATED: This command rejects execution when the Architecture entity
 * is deprecated, with migration guidance directing to individual entities.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { ArchitectureErrorMessages } from "../../../../../domain/architecture/Constants.js";
import { ARCHITECTURE_REJECTION_MESSAGE } from "../../../../../application/context/architecture/ArchitectureDeprecationConstants.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Update project architecture details (deprecated)",
  category: "solution",
  options: [
    {
      flags: "-d, --description <description>",
      description: "High-level architectural overview"
    },
    {
      flags: "--organization <organization>",
      description: "Architectural organization (e.g., 'Clean Architecture', 'Hexagonal')"
    },
    {
      flags: "--pattern <patterns...>",
      description: "Architectural patterns used"
    },
    {
      flags: "--principle <principles...>",
      description: "Design principles followed"
    },
    {
      flags: "--data-store <dataStores...>",
      description: "Data stores (format: name:type:purpose)"
    },
    {
      flags: "--stack <stack...>",
      description: "Technology stack items"
    }
  ],
  examples: [
    {
      command: "jumbo architecture update --pattern DDD CQRS EventSourcing --principle SOLID DRY",
      description: "Update architecture patterns and principles"
    },
  ],
  related: ["decision add", "invariant add", "component add", "dependency add"]
};

/**
 * Command handler — delegates to controller; rejects with migration guidance
 * when the Architecture entity is deprecated.
 */
export async function architectureUpdate(
  options: {
    description?: string;
    organization?: string;
    pattern?: string[];
    principle?: string[];
    dataStore?: string[];
    stack?: string[];
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    await container.updateArchitectureController.handle({
      description: options.description,
      organization: options.organization,
      patterns: options.pattern,
      principles: options.principle,
      dataStores: options.dataStore,
      stack: options.stack
    });

    renderer.success("Architecture updated successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === ArchitectureErrorMessages.DEPRECATED) {
      renderer.error(ARCHITECTURE_REJECTION_MESSAGE);
    } else {
      renderer.error("Failed to update architecture", error instanceof Error ? error : String(error));
    }
    process.exit(1);
  }
}
