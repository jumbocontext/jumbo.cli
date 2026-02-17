/**
 * SqliteAudienceUpdatedProjector - SQLite projector for AudienceUpdatedEvent event.
 *
 * Implements IAudienceUpdatedProjector for projecting audience update events
 * to the SQLite read model, and IAudienceUpdateReader for post-update view fetching.
 */

import { Database } from "better-sqlite3";
import { IAudienceUpdatedProjector } from "../../../../application/context/audiences/update/IAudienceUpdatedProjector.js";
import { IAudienceUpdateReader } from "../../../../application/context/audiences/update/IAudienceUpdateReader.js";
import { AudienceUpdatedEvent } from "../../../../domain/audiences/update/AudienceUpdatedEvent.js";
import { AudienceView } from "../../../../application/context/audiences/AudienceView.js";
import { AudiencePriorityType } from "../../../../domain/audiences/Constants.js";

export class SqliteAudienceUpdatedProjector
  implements IAudienceUpdatedProjector, IAudienceUpdateReader
{
  constructor(private db: Database) {}

  async applyAudienceUpdated(event: AudienceUpdatedEvent): Promise<void> {
    // Build dynamic UPDATE statement for only changed fields
    const updates: string[] = [];
    const params: unknown[] = [];

    if (event.payload.name !== undefined) {
      updates.push("name = ?");
      params.push(event.payload.name);
    }
    if (event.payload.description !== undefined) {
      updates.push("description = ?");
      params.push(event.payload.description);
    }
    if (event.payload.priority !== undefined) {
      updates.push("priority = ?");
      params.push(event.payload.priority);
    }

    // Always update version and timestamp
    updates.push("version = ?", "updatedAt = ?");
    params.push(event.version, event.timestamp);

    // WHERE clause
    params.push(event.aggregateId);

    const stmt = this.db.prepare(`
      UPDATE audience_views
      SET ${updates.join(", ")}
      WHERE audienceId = ?
    `);

    stmt.run(...params);
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
      isRemoved: row.isRemoved as boolean,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
