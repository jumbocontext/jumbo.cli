import { RelationNodeReferenceResolver } from "../traverse/RelationNodeReferenceResolver.js";
import { RelationTraversalQueryNormalizer } from "../traverse/RelationTraversalQueryNormalizer.js";
import { FindRelationPathRequest } from "./FindRelationPathRequest.js";
import { IFindRelationPathGateway } from "./IFindRelationPathGateway.js";
import { RelationPathResult } from "./RelationPathResult.js";
import { RelationShortestPathFinder } from "./RelationShortestPathFinder.js";

export class LocalFindRelationPathGateway implements IFindRelationPathGateway {
  constructor(
    private readonly nodeResolver: RelationNodeReferenceResolver,
    private readonly queryNormalizer: RelationTraversalQueryNormalizer,
    private readonly shortestPathFinder: RelationShortestPathFinder,
  ) {}

  async findPath(
    request: FindRelationPathRequest,
  ): Promise<RelationPathResult> {
    const query = this.queryNormalizer.normalize(
      {
        depth: request.maxDepth,
        direction: request.direction,
        relationType: request.relationType,
        relatedEntityType: request.relatedEntityType,
        strength: request.strength,
        status: request.status,
      },
      5,
    );
    const from = await this.nodeResolver.resolve(
      request.fromEntityId,
      request.fromEntityType,
      "--from-type",
      "From entity",
    );
    const to = await this.nodeResolver.resolve(
      request.toEntityId,
      request.toEntityType,
      "--to-type",
      "To entity",
    );

    return this.shortestPathFinder.find(from, to, query);
  }
}
