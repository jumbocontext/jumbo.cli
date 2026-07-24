import { RelationView } from "../RelationView.js";
import { RelationDirection } from "../get/RelationDirection.js";
import { RelationNodeReference } from "../get/RelationNodeReference.js";

export class RelationTraversalPolicy {
  relatedNode(
    current: RelationNodeReference,
    edge: RelationView,
    direction: RelationDirection,
  ): RelationNodeReference | undefined {
    const isFrom =
      edge.fromEntityType === current.entityType &&
      edge.fromEntityId === current.entityId;
    const isTo =
      edge.toEntityType === current.entityType &&
      edge.toEntityId === current.entityId;

    if (isFrom && direction !== "in") {
      return { entityType: edge.toEntityType, entityId: edge.toEntityId };
    }
    if (isTo && direction !== "out") {
      return { entityType: edge.fromEntityType, entityId: edge.fromEntityId };
    }
    return undefined;
  }

  nodeKey(node: RelationNodeReference): string {
    return `${node.entityType}\u0000${node.entityId}`;
  }

  compareNodes(
    left: RelationNodeReference,
    right: RelationNodeReference,
  ): number {
    return (
      left.entityType.localeCompare(right.entityType) ||
      left.entityId.localeCompare(right.entityId)
    );
  }

  compareEdges(left: RelationView, right: RelationView): number {
    return (
      left.createdAt.localeCompare(right.createdAt) ||
      left.relationId.localeCompare(right.relationId) ||
      left.fromEntityType.localeCompare(right.fromEntityType) ||
      left.fromEntityId.localeCompare(right.fromEntityId) ||
      left.toEntityType.localeCompare(right.toEntityType) ||
      left.toEntityId.localeCompare(right.toEntityId)
    );
  }
}
