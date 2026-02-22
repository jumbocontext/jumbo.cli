/**
 * CLI Command: jumbo architecture define
 *
 * Defines the system architecture for the project.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Define project architecture",
  category: "solution",
  requiredOptions: [
    {
      flags: "-d, --description <description>",
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
      command: 'jumbo architecture define --description "Event-sourced DDD system" --organization "Clean Architecture" --pattern DDD CQRS --stack TypeScript Node.js',
      description: "Define architecture with patterns and stack"
    },
    {
      command: 'jumbo architecture define --description "REST API" --organization "Layered"',
      description: "Minimal architecture definition"
    },
    {
      command: 'jumbo architecture define --description "Microservices platform" --organization "Hexagonal" --data-store postgres:relational:primary redis:cache:sessions --principle "Single Responsibility" "Dependency Inversion"',
      description: "Define with data stores and principles"
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
    // Build typed request and delegate to controller
    const result = await container.defineArchitectureController.handle({
      description: options.description,
      organization: options.organization,
      patterns: options.pattern,
      principles: options.principle,
      dataStores: options.dataStore,
      stack: options.stack
    });

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
