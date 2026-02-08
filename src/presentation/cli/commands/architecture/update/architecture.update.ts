/**
 * CLI Command: jumbo architecture update
 *
 * Updates an existing Architecture aggregate with new details.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { UpdateArchitectureCommandHandler } from "../../../../../application/architecture/update/UpdateArchitectureCommandHandler.js";
import { UpdateArchitectureCommand } from "../../../../../application/architecture/update/UpdateArchitectureCommand.js";
import { DataStore } from "../../../../../domain/architecture/define/ArchitectureDefinedEvent.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Update project architecture details",
  category: "solution",
  options: [
    {
      flags: "--description <description>",
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
    // 1. Create command handler using container dependencies
    const commandHandler = new UpdateArchitectureCommandHandler(
      container.architectureUpdatedEventStore,
      container.architectureUpdatedEventStore,
      container.eventBus
    );

    // 2. Parse data stores from string format
    let dataStores: DataStore[] | undefined;
    if (options.dataStore) {
      dataStores = options.dataStore.map(ds => {
        const [name, type, purpose] = ds.split(':');
        return { name, type, purpose };
      });
    }

    // 3. Build command
    const command: UpdateArchitectureCommand = {
      description: options.description,
      organization: options.organization,
      patterns: options.pattern,
      principles: options.principle,
      dataStores,
      stack: options.stack
    };

    // 4. Execute command
    await commandHandler.execute(command);

    // 5. Fetch updated view for display
    const view = await container.architectureUpdatedProjector.findById('architecture');

    // Success output
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
