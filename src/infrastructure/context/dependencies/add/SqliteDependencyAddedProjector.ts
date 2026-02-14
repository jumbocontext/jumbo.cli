/**
 * SqliteDependencyAddedProjector - SQLite projector for DependencyAdded event.
 *
 * Implements IDependencyAddedProjector and IDependencyAddReader for projecting
 * dependency add events to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IDependencyAddedProjector } from "../../../../application/context/dependencies/add/IDependencyAddedProjector.js";
import { IDependencyAddReader } from "../../../../application/context/dependencies/add/IDependencyAddReader.js";
import { DependencyAddedEvent } from "../../../../domain/dependencies/add/DependencyAddedEvent.js";
import { DependencyView } from "../../../../application/context/dependencies/DependencyView.js";

export class SqliteDependencyAddedProjector implements IDependencyAddedProjector, IDependencyAddReader {
  constructor(private db: Database) {}

  async applyDependencyAdded(event: DependencyAddedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO dependency_views (
        dependencyId, consumerId, providerId, endpoint, contract,
        status, version, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.aggregateId,
      event.payload.consumerId,
      event.payload.providerId,
      event.payload.endpoint,
      event.payload.contract,
      'active',
      event.version,
      event.timestamp,
      event.timestamp
    );
  }

  async findById(id: string): Promise<DependencyView | null> {
    const row = this.db.prepare('SELECT * FROM dependency_views WHERE dependencyId = ?').get(id);
    return row ? this.mapRowToView(row as Record<string, unknown>) : null;
  }

  async findByConsumerId(consumerId: string): Promise<DependencyView[]> {
    const rows = this.db
      .prepare('SELECT * FROM dependency_views WHERE consumerId = ? ORDER BY createdAt DESC')
      .all(consumerId);
    return rows.map(row => this.mapRowToView(row as Record<string, unknown>));
  }

  async findByProviderId(providerId: string): Promise<DependencyView[]> {
    const rows = this.db
      .prepare('SELECT * FROM dependency_views WHERE providerId = ? ORDER BY createdAt DESC')
      .all(providerId);
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
