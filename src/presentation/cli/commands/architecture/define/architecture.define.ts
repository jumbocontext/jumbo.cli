/**
 * CLI Command: jumbo architecture define
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
  description: "Define project architecture (deprecated)",
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
  ],
  related: ["decision add", "invariant add", "component add", "dependency add"]
};

/**
 * Command handler — delegates to controller; rejects with migration guidance
 * when the Architecture entity is deprecated.
 */
export async function architectureDefine(
  options: {
    description: string;
    organization: string;
    pattern?: string[];
    principle?: string[];
    dataStore?: string[];
    stack?: string[];
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const result = await container.defineArchitectureController.handle({
      description: options.description,
      organization: options.organization,
      patterns: options.pattern,
      principles: options.principle,
      dataStores: options.dataStore,
      stack: options.stack
    });

    renderer.success(`Architecture defined successfully`);
    renderer.info(`Architecture ID: ${result.architectureId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === ArchitectureErrorMessages.DEPRECATED) {
      renderer.error(ARCHITECTURE_REJECTION_MESSAGE);
    } else {
      renderer.error("Failed to define architecture", error instanceof Error ? error : String(error));
    }
    process.exit(1);
  }
}
