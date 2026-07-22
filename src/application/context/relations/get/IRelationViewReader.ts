/**
 * Port interface for listing relations from the projection store.
 * Used by ListRelationsQueryHandler to retrieve relation list with optional filtering.
 */

import { EntityTypeValue } from "../../../../domain/relations/Constants.js";
import { RelationView } from "../RelationView.js";
import { RelationListFilter } from "./RelationListFilter.js";

export interface IRelationViewReader {
  /**
   * Retrieves all relations, optionally filtered by entity or status.
   * @param filter - Optional filter for entity type/id and status
   * @returns Array of relation views ordered by creation date
   */
  findAll(filter?: RelationListFilter): Promise<RelationView[]>;

  /** Returns the distinct projection endpoint types associated with an entity ID. */
  findEndpointTypes(entityId: string): Promise<EntityTypeValue[]>;
}
