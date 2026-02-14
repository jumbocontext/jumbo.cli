/**
 * SqliteDependencyContextReader - SQLite reader for dependency context queries.
 *
 * Implements IDependencyContextReader for reading dependencies
 * used by GetGoalContextQueryHandler.
 */

import { Database } from "better-sqlite3";
import { IDependencyContextReader } from "../../../../application/context/goals/get-context/IDependencyContextReader.js";
import { DependencyView } from "../../../../application/context/dependencies/DependencyView.js";

export class SqliteDependencyContextReader implements IDependencyContextReader {
  constructor(private db: Database) {}

  async findAll(): Promise<DependencyView[]> {
    const rows = this.db.prepare('SELECT * FROM dependency_views ORDER BY createdAt DESC').all();
    return rows.map(row => this.mapRowToView(row as Record<string, unknown>));
  }

  async findByIds(ids: string[]): Promise<DependencyView[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => '?').join(',');
    const query = `SELECT * FROM dependency_views WHERE dependencyId IN (${placeholders}) ORDER BY createdAt DESC`;
    const rows = this.db.prepare(query).all(...ids);
    return rows.map(row => this.mapRowToView(row as Record<string, unknown>));
  }

  private mapRowToView(row: Record<string, unknown>): DependencyView {
    return {
      dependencyId: row.dependencyId as string,
      consumerId: row.consumerId as string,
      providerId: row.providerId as string,
      endpoint: (row.endpoint as string) ?? null,
      contract: (row.contract as string) ?? null,
      status: row.status as DependencyView['status'],
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
      removedAt: (row.removedAt as string) ?? null,
      removalReason: (row.removalReason as string) ?? null,
    };
  }
}
