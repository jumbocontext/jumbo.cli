/**
 * SqliteDependencyRemovedProjector - SQLite projector for DependencyRemoved event.
 *
 * Implements IDependencyRemovedProjector and IDependencyRemoveReader for projecting
 * dependency remove events to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IDependencyRemovedProjector } from "../../../../application/context/dependencies/remove/IDependencyRemovedProjector.js";
import { IDependencyRemoveReader } from "../../../../application/context/dependencies/remove/IDependencyRemoveReader.js";
import { DependencyRemovedEvent } from "../../../../domain/dependencies/remove/DependencyRemovedEvent.js";
import { DependencyView } from "../../../../application/context/dependencies/DependencyView.js";

export class SqliteDependencyRemovedProjector implements IDependencyRemovedProjector, IDependencyRemoveReader {
  constructor(private db: Database) {}

  async applyDependencyRemoved(event: DependencyRemovedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE dependency_views
      SET status = 'removed',
          removedAt = ?,
          removalReason = ?,
          updatedAt = ?,
          version = ?
      WHERE dependencyId = ?
    `);

    stmt.run(
      event.timestamp,
      event.payload.reason,
      event.timestamp,
      event.version,
      event.aggregateId
    );
  }

  async findById(id: string): Promise<DependencyView | null> {
    const row = this.db.prepare('SELECT * FROM dependency_views WHERE dependencyId = ?').get(id);
    return row ? this.mapRowToView(row as Record<string, unknown>) : null;
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
