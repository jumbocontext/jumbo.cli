/**
 * SqliteRelationViewReader - SQLite reader for listing relations.
 *
 * Implements IRelationViewReader for retrieving relation list
 * from the SQLite read model with optional entity filtering.
 */

import { Database } from "better-sqlite3";
import { IRelationViewReader, RelationListFilter } from "../../../../application/context/relations/get/IRelationViewReader.js";
import { RelationView } from "../../../../application/context/relations/RelationView.js";
import { RelationRecord } from "../RelationRecord.js";
import { RelationRecordMapper } from "../RelationRecordMapper.js";

export class SqliteRelationViewReader implements IRelationViewReader {
  private readonly mapper = new RelationRecordMapper();

  constructor(private db: Database) {}

  async findAll(filter?: RelationListFilter): Promise<RelationView[]> {
    let query = "SELECT * FROM relation_views WHERE 1=1";
    const params: (string | number)[] = [];

    // Apply status filter (default to active only)
    if (!filter?.status || filter.status === "active") {
      query += " AND status = 'active'";
    } else if (filter.status === "deactivated") {
      query += " AND status = 'deactivated'";
    } else if (filter.status === "removed") {
      query += " AND status = 'removed'";
    }
    // If status === 'all', no filter applied

    // Apply entity filter (matches either source or target)
    if (filter?.entityType && filter?.entityId) {
      query += " AND ((fromEntityType = ? AND fromEntityId = ?) OR (toEntityType = ? AND toEntityId = ?))";
      params.push(filter.entityType, filter.entityId, filter.entityType, filter.entityId);
    } else if (filter?.entityType) {
      query += " AND (fromEntityType = ? OR toEntityType = ?)";
      params.push(filter.entityType, filter.entityType);
    } else if (filter?.entityId) {
      query += " AND (fromEntityId = ? OR toEntityId = ?)";
      params.push(filter.entityId, filter.entityId);
    }

    query += " ORDER BY createdAt ASC";

    const rows = this.db.prepare(query).all(...params);
    return rows.map((row) => this.mapper.toView(this.mapRowToRecord(row as Record<string, unknown>)));
  }

  private mapRowToRecord(row: Record<string, unknown>): RelationRecord {
    return {
      id: row.relationId as string,
      fromEntityType: row.fromEntityType as string,
      fromEntityId: row.fromEntityId as string,
      toEntityType: row.toEntityType as string,
      toEntityId: row.toEntityId as string,
      relationType: row.relationType as string,
      strength: (row.strength as string) ?? null,
      description: row.description as string,
      status: row.status as string,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
