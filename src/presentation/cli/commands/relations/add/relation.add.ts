/**
 * CLI Command: jumbo relation add
 *
 * Creates a directed relationship between two entities in the knowledge graph.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { AddRelationCommandHandler } from "../../../../../application/relations/add/AddRelationCommandHandler.js";
import { AddRelationCommand } from "../../../../../application/relations/add/AddRelationCommand.js";
import { EntityTypeValue, RelationStrengthValue } from "../../../../../domain/relations/Constants.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Add a relationship between two entities in the knowledge graph",
  category: "relations",
  requiredOptions: [
    {
      flags: "--from-type <fromType>",
      description: "Source entity type (e.g., goal, component, dependency)"
    },
    {
      flags: "--from-id <fromId>",
      description: "Source entity ID"
    },
    {
      flags: "--to-type <toType>",
      description: "Target entity type (e.g., goal, component, dependency)"
    },
    {
      flags: "--to-id <toId>",
      description: "Target entity ID"
    },
    {
      flags: "--relation-type <relationType>",
      description: "Type of relationship (e.g., involves, uses, depends-on)"
    },
    {
      flags: "--description <description>",
      description: "Human-readable explanation of the relationship"
    }
  ],
  options: [
    {
      flags: "--strength <strength>",
      description: "Relationship strength: strong, medium, or weak"
    }
  ],
  examples: [
    {
      command: "jumbo relation add --from-type goal --from-id auth-impl --to-type component --to-id TokenService --relation-type involves --description 'Goal requires TokenService implementation'",
      description: "Link a goal to a component it involves"
    },
    {
      command: "jumbo relation add --from-type component --from-id TokenService --to-type dependency --to-id jsonwebtoken --relation-type uses --strength strong --description 'TokenService critically depends on jsonwebtoken'",
      description: "Link a component to its dependency with strength"
    }
  ],
  related: ["relation remove"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function relationAdd(options: {
  fromType: string;
  fromId: string;
  toType: string;
  toId: string;
  relationType: string;
  description: string;
  strength?: string;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler using container dependencies
    const commandHandler = new AddRelationCommandHandler(
      container.relationAddedEventStore,
      container.eventBus,
      container.relationAddedProjector
    );

    // 2. Execute command
    const command: AddRelationCommand = {
      fromEntityType: options.fromType as EntityTypeValue,
      fromEntityId: options.fromId,
      toEntityType: options.toType as EntityTypeValue,
      toEntityId: options.toId,
      relationType: options.relationType,
      description: options.description,
      strength: options.strength as RelationStrengthValue | undefined
    };

    const result = await commandHandler.execute(command);

    // 3. Fetch updated view for display
    const view = await container.relationRemovedProjector.findById(result.relationId);

    // Success output
    const data: Record<string, string> = {
      relationId: result.relationId,
      from: `${options.fromType}:${options.fromId}`,
      relationType: options.relationType,
      to: `${options.toType}:${options.toId}`,
    };
    if (options.strength) {
      data.strength = options.strength;
    }

    renderer.success("Relation added successfully", data);
  } catch (error) {
    renderer.error("Failed to add relation", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
