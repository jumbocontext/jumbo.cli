import {
  EntityType,
  EntityTypeValue,
  RelationStrength,
  RelationStrengthValue,
} from "../../../../domain/relations/Constants.js";
import { RelationDirection } from "../get/RelationDirection.js";
import { RelationStatusFilter } from "../get/RelationStatusFilter.js";
import { RelationTraversalQuery } from "./RelationTraversalQuery.js";

type RelationTraversalQueryInput = {
  readonly depth?: number;
  readonly direction?: RelationDirection;
  readonly relationType?: string;
  readonly relatedEntityType?: EntityTypeValue;
  readonly strength?: RelationStrengthValue;
  readonly status?: RelationStatusFilter;
};

export class RelationTraversalQueryNormalizer {
  normalize(
    request: RelationTraversalQueryInput,
    defaultDepth = 1,
  ): RelationTraversalQuery {
    const depth = request.depth ?? defaultDepth;
    if (!Number.isInteger(depth) || depth < 1 || depth > 5) {
      throw new Error("Depth must be an integer from 1 through 5.");
    }

    const direction = request.direction ?? "both";
    if (!(["in", "out", "both"] as string[]).includes(direction)) {
      throw new Error("Direction must be one of: in, out, both.");
    }

    const status = request.status ?? "active";
    if (
      !(["active", "deactivated", "removed", "all"] as string[]).includes(
        status,
      )
    ) {
      throw new Error(
        "Status must be one of: active, deactivated, removed, all.",
      );
    }

    if (
      request.relatedEntityType &&
      !Object.values(EntityType).includes(request.relatedEntityType)
    ) {
      throw new Error(
        `Related entity type must be one of: ${Object.values(EntityType).join(", ")}.`,
      );
    }

    if (
      request.strength &&
      !Object.values(RelationStrength).includes(request.strength)
    ) {
      throw new Error("Strength must be one of: strong, medium, weak.");
    }

    return {
      depth,
      direction,
      relationType: request.relationType,
      relatedEntityType: request.relatedEntityType,
      strength: request.strength,
      status,
    };
  }
}
