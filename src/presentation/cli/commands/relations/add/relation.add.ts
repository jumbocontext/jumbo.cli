/**
 * CLI Command: jumbo relation add
 *
 * Creates a directed relationship between two entities in the knowledge graph.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { AddRelationRequest } from "../../../../../application/context/relations/add/AddRelationRequest.js";
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
      flags: "-T, --type <type>",
      description: "Type of relationship (e.g., involves, uses, depends-on)"
    },
    {
      flags: "-d, --description <description>",
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
      command: "jumbo relation add --from-type goal --from-id auth-impl --to-type component --to-id TokenService --type involves --description 'Goal requires TokenService implementation'",
      description: "Link a goal to a component it involves"
    },
    {
      command: "jumbo relation add --from-type component --from-id TokenService --to-type dependency --to-id jsonwebtoken --type uses --strength strong --description 'TokenService critically depends on jsonwebtoken'",
      description: "Link a component to its dependency with strength"
    }
  ],
  related: ["relation remove"],
  requiresProject: true
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
  type: string;
  description: string;
  strength?: string;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    const request: AddRelationRequest = {
      fromEntityType: options.fromType as EntityTypeValue,
      fromEntityId: options.fromId,
      toEntityType: options.toType as EntityTypeValue,
      toEntityId: options.toId,
      relationType: options.type,
      description: options.description,
      strength: options.strength as RelationStrengthValue | undefined
    };

    const { relationId } = await container.addRelationController.handle(request);

    const data: Record<string, string> = {
      relationId,
      from: `${options.fromType}:${options.fromId}`,
      relationType: options.type,
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
}
