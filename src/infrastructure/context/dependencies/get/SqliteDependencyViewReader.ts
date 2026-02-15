/**
 * SqliteDependencyViewReader - SQLite reader for listing dependencies.
 *
 * Implements IDependencyViewReader for retrieving dependency list
 * from the SQLite read model with optional consumer/provider filtering.
 */

import { Database } from "better-sqlite3";
import { IDependencyViewReader, DependencyListFilter } from "../../../../application/context/dependencies/get/IDependencyViewReader.js";
import { DependencyView } from "../../../../application/context/dependencies/DependencyView.js";

export class SqliteDependencyViewReader implements IDependencyViewReader {
  constructor(private db: Database) {}

  async findAll(filter?: DependencyListFilter): Promise<DependencyView[]> {
    let query = "SELECT * FROM dependency_views";
    const conditions: string[] = [];
    const params: string[] = [];

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
    return rows.map((row) => this.mapRowToView(row as Record<string, unknown>));
  }

  private mapRowToView(row: Record<string, unknown>): DependencyView {
    return {
      dependencyId: row.dependencyId as string,
      consumerId: row.consumerId as string,
      providerId: row.providerId as string,
      endpoint: (row.endpoint as string) ?? null,
      contract: (row.contract as string) ?? null,
      status: row.status as DependencyView["status"],
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
      removedAt: (row.removedAt as string) ?? null,
      removalReason: (row.removalReason as string) ?? null,
    };
  }
}
