/**
 * GetRelationsQueryHandler - Query handler for listing knowledge graph relations.
 *
 * This is a standard CQRS query handler that provides read access to
 * the Relation projection for listing purposes with optional filtering.
 */

import { IRelationViewReader, RelationListFilter } from "./IRelationViewReader.js";
import { RelationView } from "../RelationView.js";

export class GetRelationsQueryHandler {
  constructor(
    private readonly relationViewReader: IRelationViewReader
  ) {}

  async execute(filter?: RelationListFilter): Promise<RelationView[]> {
    return this.relationViewReader.findAll(filter);
  }
}
