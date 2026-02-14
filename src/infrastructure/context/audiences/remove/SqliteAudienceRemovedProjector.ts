/**
 * SqliteAudienceRemovedProjector - SQLite projector for AudienceRemovedEvent event.
 *
 * Implements IAudienceRemovedProjector and IAudienceRemoveReader for projecting
 * audience remove events to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IAudienceRemovedProjector } from "../../../../application/context/audiences/remove/IAudienceRemovedProjector.js";
import { IAudienceRemoveReader } from "../../../../application/context/audiences/remove/IAudienceRemoveReader.js";
import { AudienceRemovedEvent } from "../../../../domain/audiences/remove/AudienceRemovedEvent.js";
import { AudienceView } from "../../../../application/context/audiences/AudienceView.js";
import { AudiencePriorityType } from "../../../../domain/audiences/Constants.js";

export class SqliteAudienceRemovedProjector
  implements IAudienceRemovedProjector, IAudienceRemoveReader
{
  constructor(private db: Database) {}

  async applyAudienceRemoved(event: AudienceRemovedEvent): Promise<void> {
    // Soft-delete: mark as removed instead of deleting
    const stmt = this.db.prepare(`
      UPDATE audience_views
      SET isRemoved = 1,
          version = ?,
          updatedAt = ?
      WHERE audienceId = ?
    `);

    stmt.run(event.version, event.timestamp, event.aggregateId);
  }

  async findById(id: string): Promise<AudienceView | null> {
    const row = this.db
      .prepare("SELECT * FROM audience_views WHERE audienceId = ?")
      .get(id);
    return row ? this.mapRowToView(row as Record<string, unknown>) : null;
  }

  private mapRowToView(row: Record<string, unknown>): AudienceView {
    return {
      audienceId: row.audienceId as string,
      name: row.name as string,
      description: row.description as string,
      priority: row.priority as AudiencePriorityType,
      isRemoved: Boolean(row.isRemoved),
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
