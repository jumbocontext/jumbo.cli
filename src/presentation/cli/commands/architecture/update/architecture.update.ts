/**
 * CLI Command: jumbo architecture update
 *
 * Updates an existing Architecture aggregate with new details.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { UpdateArchitectureRequest } from "../../../../../application/context/architecture/update/UpdateArchitectureRequest.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Update project architecture details",
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
    {
      command: 'jumbo architecture update --description "Updated architectural overview"',
      description: "Update only the description"
    }
  ],
  related: ["architecture define", "component add"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function architectureUpdate(
  options: {
    description?: string;
    organization?: string;
    pattern?: string[];
    principle?: string[];
    dataStore?: string[];  // Format: "name:type:purpose"
    stack?: string[];
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Build typed request
    const request: UpdateArchitectureRequest = {
      description: options.description,
      organization: options.organization,
      patterns: options.pattern,
      principles: options.principle,
      dataStores: options.dataStore,
      stack: options.stack
    };

    // 2. Delegate to controller
    await container.updateArchitectureController.handle(request);

    // 3. Success output
    renderer.success("Architecture updated successfully");

    // Show what was updated
    if (options.description) renderer.info(`Updated description: ${options.description}`);
    if (options.organization) renderer.info(`Updated organization: ${options.organization}`);
    if (options.pattern) renderer.info(`Updated patterns: ${options.pattern.join(', ')}`);
    if (options.principle) renderer.info(`Updated principles: ${options.principle.join(', ')}`);
    if (options.dataStore) renderer.info(`Updated data stores: ${options.dataStore.join(', ')}`);
    if (options.stack) renderer.info(`Updated stack: ${options.stack.join(', ')}`);
  } catch (error) {
    renderer.error("Failed to update architecture", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
