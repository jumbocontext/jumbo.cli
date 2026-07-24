import {
  EntityType,
  EntityTypeValue,
} from "../../../../domain/relations/Constants.js";
import { IRelationViewReader } from "../get/IRelationViewReader.js";
import { RelationNodeReference } from "../get/RelationNodeReference.js";

export class RelationNodeReferenceResolver {
  constructor(private readonly relationViewReader: IRelationViewReader) {}

  async resolve(
    entityId: string,
    explicitType?: EntityTypeValue,
    typeOption = "--entity-type",
    endpointLabel = "Entity",
  ): Promise<RelationNodeReference> {
    const normalizedEntityId = entityId?.trim();
    if (!normalizedEntityId) {
      throw new Error(`${endpointLabel} ID must be provided.`);
    }

    if (explicitType) {
      if (!Object.values(EntityType).includes(explicitType)) {
        throw new Error(
          `${endpointLabel} type must be one of: ${Object.values(EntityType).join(", ")}.`,
        );
      }
      return { entityType: explicitType, entityId: normalizedEntityId };
    }

    const candidates =
      await this.relationViewReader.findEndpointTypes(normalizedEntityId);
    if (candidates.length === 1) {
      return { entityType: candidates[0], entityId: normalizedEntityId };
    }
    if (candidates.length === 0) {
      throw new Error(
        `No endpoint type can be inferred for entity ID '${normalizedEntityId}'. ` +
          `Specify ${typeOption} explicitly.`,
      );
    }

    throw new Error(
      `Entity ID '${normalizedEntityId}' matches multiple endpoint types: ` +
        `${[...candidates].sort().join(", ")}. Specify ${typeOption} explicitly.`,
    );
  }
}
