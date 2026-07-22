import {
  EntityType,
  EntityTypeValue,
  RelationStrength,
} from "../../../../domain/relations/Constants.js";
import { RelationView } from "../RelationView.js";
import { IRelationViewReader } from "../get/IRelationViewReader.js";
import { RelationDirection } from "../get/RelationDirection.js";
import { RelationStatusFilter } from "../get/RelationStatusFilter.js";
import { RelationNodeReference } from "../get/RelationNodeReference.js";
import { ITraverseRelationsGateway } from "./ITraverseRelationsGateway.js";
import { RelationTraversalNode } from "./RelationTraversalNode.js";
import { RelationTraversalResult } from "./RelationTraversalResult.js";
import { TraverseRelationsRequest } from "./TraverseRelationsRequest.js";

type NormalizedTraversalRequest = {
  entityId: string;
  entityType?: EntityTypeValue;
  depth: number;
  direction: RelationDirection;
  relationType?: string;
  relatedEntityType?: EntityTypeValue;
  strength?: "strong" | "medium" | "weak";
  status: RelationStatusFilter;
  limit: number;
};

export class LocalTraverseRelationsGateway implements ITraverseRelationsGateway {
  constructor(private readonly relationViewReader: IRelationViewReader) {}

  async traverse(request: TraverseRelationsRequest): Promise<RelationTraversalResult> {
    const normalized = this.normalize(request);
    const root = await this.resolveRoot(normalized.entityId, normalized.entityType);
    const visited = new Set<string>([this.nodeKey(root)]);
    const nodes = new Map<string, RelationTraversalNode>();
    const edges = new Map<string, RelationView>();
    let frontier: RelationNodeReference[] = [root];
    let truncated = false;

    traversal:
    for (let distance = 1; distance <= normalized.depth && frontier.length > 0; distance++) {
      const next = new Map<string, RelationNodeReference>();

      for (const current of [...frontier].sort((left, right) => this.compareNodes(left, right))) {
        const adjacent = await this.relationViewReader.findAll({
          entity: current,
          direction: normalized.direction,
          relationType: normalized.relationType,
          relatedEntityType: normalized.relatedEntityType,
          strength: normalized.strength,
          status: normalized.status,
        });

        for (const edge of [...adjacent].sort((left, right) => this.compareEdges(left, right))) {
          if (edges.has(edge.relationId)) continue;

          edges.set(edge.relationId, edge);
          const related = this.relatedNode(current, edge, normalized.direction);
          if (related) {
            const relatedKey = this.nodeKey(related);
            if (!visited.has(relatedKey)) {
              visited.add(relatedKey);
              const traversalNode: RelationTraversalNode = { ...related, distance };
              nodes.set(relatedKey, traversalNode);
              next.set(relatedKey, related);
            }
          }

          if (edges.size === normalized.limit) {
            truncated = true;
            break traversal;
          }
        }
      }

      frontier = [...next.values()];
    }

    const stableNodes = [...nodes.values()].sort((left, right) =>
      left.distance - right.distance || this.compareNodes(left, right)
    );
    const stableEdges = [...edges.values()].sort((left, right) => this.compareEdges(left, right));

    return {
      root,
      nodes: stableNodes,
      edges: stableEdges,
      requestedDepth: normalized.depth,
      reachedDepth: stableNodes.reduce((maximum, node) => Math.max(maximum, node.distance), 0),
      limit: normalized.limit,
      truncated,
    };
  }

  private normalize(request: TraverseRelationsRequest): NormalizedTraversalRequest {
    const entityId = request.entityId?.trim();
    if (!entityId) throw new Error("Entity ID must be provided.");

    const depth = request.depth ?? 1;
    if (!Number.isInteger(depth) || depth < 1 || depth > 5) {
      throw new Error("Depth must be an integer from 1 through 5.");
    }

    const limit = request.limit ?? 100;
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
      throw new Error("Limit must be an integer from 1 through 1000.");
    }

    const direction = request.direction ?? "both";
    if (!["in", "out", "both"].includes(direction)) {
      throw new Error("Direction must be one of: in, out, both.");
    }

    const status = request.status ?? "active";
    if (!["active", "deactivated", "removed", "all"].includes(status)) {
      throw new Error("Status must be one of: active, deactivated, removed, all.");
    }

    if (request.entityType) this.assertEntityType(request.entityType, "Entity type");
    if (request.relatedEntityType) this.assertEntityType(request.relatedEntityType, "Related entity type");
    if (request.strength && !Object.values(RelationStrength).includes(request.strength)) {
      throw new Error("Strength must be one of: strong, medium, weak.");
    }

    return {
      ...request,
      entityId,
      depth,
      direction,
      status,
      limit,
    };
  }

  private async resolveRoot(
    entityId: string,
    explicitType: EntityTypeValue | undefined
  ): Promise<RelationNodeReference> {
    if (explicitType) return { entityType: explicitType, entityId };

    const candidates = await this.relationViewReader.findEndpointTypes(entityId);
    if (candidates.length === 1) return { entityType: candidates[0], entityId };
    if (candidates.length === 0) {
      throw new Error(
        `No endpoint type can be inferred for entity ID '${entityId}'. Specify --entity-type explicitly.`
      );
    }

    throw new Error(
      `Entity ID '${entityId}' matches multiple endpoint types: ${[...candidates].sort().join(", ")}. ` +
      "Specify --entity-type explicitly."
    );
  }

  private relatedNode(
    current: RelationNodeReference,
    edge: RelationView,
    direction: RelationDirection
  ): RelationNodeReference | undefined {
    const isFrom = edge.fromEntityType === current.entityType && edge.fromEntityId === current.entityId;
    const isTo = edge.toEntityType === current.entityType && edge.toEntityId === current.entityId;

    if (isFrom && direction !== "in") {
      return { entityType: edge.toEntityType, entityId: edge.toEntityId };
    }
    if (isTo && direction !== "out") {
      return { entityType: edge.fromEntityType, entityId: edge.fromEntityId };
    }
    return undefined;
  }

  private assertEntityType(value: EntityTypeValue, label: string): void {
    if (!Object.values(EntityType).includes(value)) {
      throw new Error(`${label} must be one of: ${Object.values(EntityType).join(", ")}.`);
    }
  }

  private nodeKey(node: RelationNodeReference): string {
    return `${node.entityType}\u0000${node.entityId}`;
  }

  private compareNodes(left: RelationNodeReference, right: RelationNodeReference): number {
    return left.entityType.localeCompare(right.entityType) || left.entityId.localeCompare(right.entityId);
  }

  private compareEdges(left: RelationView, right: RelationView): number {
    return left.createdAt.localeCompare(right.createdAt)
      || left.relationId.localeCompare(right.relationId)
      || left.fromEntityType.localeCompare(right.fromEntityType)
      || left.fromEntityId.localeCompare(right.fromEntityId)
      || left.toEntityType.localeCompare(right.toEntityType)
      || left.toEntityId.localeCompare(right.toEntityId);
  }
}
