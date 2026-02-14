/**
 * CLI Command: jumbo architecture define
 *
 * Defines the system architecture for the project.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { DefineArchitectureCommandHandler } from "../../../../../application/context/architecture/define/DefineArchitectureCommandHandler.js";
import { DefineArchitectureCommand } from "../../../../../application/context/architecture/define/DefineArchitectureCommand.js";
import { DataStore } from "../../../../../domain/architecture/define/ArchitectureDefinedEvent.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Define project architecture",
  category: "solution",
  requiredOptions: [
    {
      flags: "--description <description>",
      description: "High-level architectural overview"
    },
    {
      flags: "--organization <organization>",
      description: "Architectural organization (e.g., 'Clean Architecture', 'Hexagonal')"
    }
  ],
  options: [
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
      command: 'jumbo architecture define --description "Event-sourced DDD system" --organization "Clean Architecture" --pattern DDD CQRS EventSourcing --stack TypeScript Node.js SQLite',
      description: "Define architecture with patterns and stack"
    }
  ],
  related: ["architecture update", "component add"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function architectureDefine(
  options: {
    description: string;
    organization: string;
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
    const commandHandler = new DefineArchitectureCommandHandler(
      container.architectureDefinedEventStore,
      container.architectureDefinedProjector,
      container.eventBus
    );

    // 2. Parse data stores from string format
    const dataStores: DataStore[] = options.dataStore?.map(ds => {
      const [name, type, purpose] = ds.split(':');
      return { name, type, purpose };
    }) || [];

    // 3. Execute command
    const command: DefineArchitectureCommand = {
      description: options.description,
      organization: options.organization,
      patterns: options.pattern,
      principles: options.principle,
      dataStores,
      stack: options.stack
    };

    const result = await commandHandler.execute(command);

    // Success output
    renderer.success(`Architecture defined successfully`);
    renderer.info(`Architecture ID: ${result.architectureId}`);
    renderer.info(`Organization: ${options.organization}`);
    if (options.pattern?.length) {
      renderer.info(`Patterns: ${options.pattern.join(', ')}`);
    }
    if (options.stack?.length) {
      renderer.info(`Stack: ${options.stack.join(', ')}`);
    }
  } catch (error) {
    renderer.error("Failed to define architecture", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
