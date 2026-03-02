/**
 * SqliteDependencyViewReader - SQLite reader for listing dependencies.
 *
 * Implements IDependencyViewReader for retrieving dependency list
 * from the SQLite read model with optional consumer/provider filtering.
 */

import { Database } from "better-sqlite3";
import { IDependencyViewReader, DependencyListFilter } from "../../../../application/context/dependencies/get/IDependencyViewReader.js";
import { DependencyView } from "../../../../application/context/dependencies/DependencyView.js";
import { DependencyRecord } from "../DependencyRecord.js";
import { DependencyRecordMapper } from "../DependencyRecordMapper.js";

export class SqliteDependencyViewReader implements IDependencyViewReader {
  private readonly mapper = new DependencyRecordMapper();

  constructor(private db: Database) {}

  async findAll(filter?: DependencyListFilter): Promise<DependencyView[]> {
    let query = "SELECT * FROM dependency_views";
    const conditions: string[] = [];
    const params: string[] = [];

    if (filter?.name) {
      conditions.push("name = ?");
      params.push(filter.name);
    }
    if (filter?.ecosystem) {
      conditions.push("ecosystem = ?");
      params.push(filter.ecosystem);
    }
    if (filter?.packageName) {
      conditions.push("packageName = ?");
      params.push(filter.packageName);
    }
    if (filter?.versionConstraint) {
      conditions.push("versionConstraint = ?");
      params.push(filter.versionConstraint);
    }

    if (filter?.consumer) {
      conditions.push("consumerId = ?");
      params.push(filter.consumer);
    }
    if (filter?.provider) {
      conditions.push("providerId = ?");
      params.push(filter.provider);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY createdAt DESC";

    const rows = this.db.prepare(query).all(...params);
    return rows.map((row) => this.mapper.toView(this.mapRowToRecord(row as Record<string, unknown>)));
  }

  async findByIds(ids: string[]): Promise<DependencyView[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => "?").join(",");
    const query = `SELECT * FROM dependency_views WHERE dependencyId IN (${placeholders}) ORDER BY createdAt DESC`;
    const rows = this.db.prepare(query).all(...ids);
    return rows.map((row) => this.mapper.toView(this.mapRowToRecord(row as Record<string, unknown>)));
  }

  private mapRowToRecord(row: Record<string, unknown>): DependencyRecord {
    return {
      id: row.dependencyId as string,
      name: (row.name as string) ?? null,
      ecosystem: (row.ecosystem as string) ?? null,
      packageName: (row.packageName as string) ?? null,
      versionConstraint: (row.versionConstraint as string) ?? null,
      consumerId: (row.consumerId as string) ?? null,
      providerId: (row.providerId as string) ?? null,
      endpoint: (row.endpoint as string) ?? null,
      contract: (row.contract as string) ?? null,
      status: row.status as string,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
      removedAt: (row.removedAt as string) ?? null,
      removalReason: (row.removalReason as string) ?? null,
    };
  }
}
