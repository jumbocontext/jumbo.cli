/**
 * ListRelationsQueryHandler - Query handler for listing knowledge graph relations.
 *
 * This is a standard CQRS query handler that provides read access to
 * the Relation projection for listing purposes with optional filtering.
 */

import { IRelationListReader, RelationListFilter } from "./IRelationListReader.js";
import { RelationView } from "../RelationView.js";

export class ListRelationsQueryHandler {
  constructor(
    private readonly relationListReader: IRelationListReader
  ) {}

  async execute(filter?: RelationListFilter): Promise<RelationView[]> {
    return this.relationListReader.findAll(filter);
  }
}
