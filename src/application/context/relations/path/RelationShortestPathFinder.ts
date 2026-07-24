import { RelationView } from "../RelationView.js";
import { IRelationViewReader } from "../get/IRelationViewReader.js";
import { RelationNodeReference } from "../get/RelationNodeReference.js";
import { RelationTraversalPolicy } from "../traverse/RelationTraversalPolicy.js";
import { RelationTraversalQuery } from "../traverse/RelationTraversalQuery.js";
import { RelationPathQueryMetadata } from "./RelationPathQueryMetadata.js";
import { RelationPathResult } from "./RelationPathResult.js";

type PathPredecessor = {
  readonly previous: RelationNodeReference;
  readonly edge: RelationView;
};

type PathTransition = {
  readonly node: RelationNodeReference;
  readonly edge: RelationView;
};

export class RelationShortestPathFinder {
  constructor(
    private readonly relationViewReader: IRelationViewReader,
    private readonly traversalPolicy = new RelationTraversalPolicy(),
  ) {}

  async find(
    from: RelationNodeReference,
    to: RelationNodeReference,
    query: RelationTraversalQuery,
  ): Promise<RelationPathResult> {
    const queryMetadata = this.toQueryMetadata(query);
    if (
      this.traversalPolicy.nodeKey(from) === this.traversalPolicy.nodeKey(to)
    ) {
      return this.foundResult(from, to, [from], [], queryMetadata);
    }

    const visited = new Set<string>([this.traversalPolicy.nodeKey(from)]);
    const predecessors = new Map<string, PathPredecessor>();
    let frontier: RelationNodeReference[] = [from];

    for (let depth = 1; depth <= query.depth && frontier.length > 0; depth++) {
      const next = new Map<string, RelationNodeReference>();
      const stableFrontier = [...frontier].sort((left, right) =>
        this.traversalPolicy.compareNodes(left, right),
      );

      for (const current of stableFrontier) {
        const adjacent = await this.relationViewReader.findAll({
          entity: current,
          direction: query.direction,
          relationType: query.relationType,
          relatedEntityType: query.relatedEntityType,
          strength: query.strength,
          status: query.status,
        });
        const transitions = this.stableTransitions(current, adjacent, query);

        for (const transition of transitions) {
          const key = this.traversalPolicy.nodeKey(transition.node);
          if (visited.has(key)) continue;

          visited.add(key);
          predecessors.set(key, { previous: current, edge: transition.edge });

          if (key === this.traversalPolicy.nodeKey(to)) {
            const path = this.reconstruct(from, to, predecessors);
            return this.foundResult(
              from,
              to,
              path.nodes,
              path.edges,
              queryMetadata,
            );
          }

          next.set(key, transition.node);
        }
      }

      frontier = [...next.values()];
    }

    return {
      found: false,
      from,
      to,
      hopCount: 0,
      nodes: [],
      edges: [],
      query: queryMetadata,
    };
  }

  private stableTransitions(
    current: RelationNodeReference,
    adjacent: RelationView[],
    query: RelationTraversalQuery,
  ): PathTransition[] {
    return adjacent
      .map((edge): PathTransition | undefined => {
        const node = this.traversalPolicy.relatedNode(
          current,
          edge,
          query.direction,
        );
        return node ? { node, edge } : undefined;
      })
      .filter(
        (transition): transition is PathTransition => transition !== undefined,
      )
      .sort(
        (left, right) =>
          this.traversalPolicy.compareNodes(left.node, right.node) ||
          this.traversalPolicy.compareEdges(left.edge, right.edge),
      );
  }

  private reconstruct(
    from: RelationNodeReference,
    to: RelationNodeReference,
    predecessors: Map<string, PathPredecessor>,
  ): { nodes: RelationNodeReference[]; edges: RelationView[] } {
    const reversedNodes: RelationNodeReference[] = [to];
    const reversedEdges: RelationView[] = [];
    let cursor = to;

    while (
      this.traversalPolicy.nodeKey(cursor) !==
      this.traversalPolicy.nodeKey(from)
    ) {
      const predecessor = predecessors.get(
        this.traversalPolicy.nodeKey(cursor),
      );
      if (!predecessor) {
        throw new Error(
          "Relation path reconstruction encountered an incomplete predecessor chain.",
        );
      }
      reversedEdges.push(predecessor.edge);
      reversedNodes.push(predecessor.previous);
      cursor = predecessor.previous;
    }

    return {
      nodes: reversedNodes.reverse(),
      edges: reversedEdges.reverse(),
    };
  }

  private foundResult(
    from: RelationNodeReference,
    to: RelationNodeReference,
    nodes: RelationNodeReference[],
    edges: RelationView[],
    query: RelationPathQueryMetadata,
  ): RelationPathResult {
    return {
      found: true,
      from,
      to,
      hopCount: edges.length,
      nodes,
      edges,
      query,
    };
  }

  private toQueryMetadata(
    query: RelationTraversalQuery,
  ): RelationPathQueryMetadata {
    return {
      maxDepth: query.depth,
      direction: query.direction,
      relationType: query.relationType,
      entityType: query.relatedEntityType,
      strength: query.strength,
      status: query.status,
    };
  }
}
