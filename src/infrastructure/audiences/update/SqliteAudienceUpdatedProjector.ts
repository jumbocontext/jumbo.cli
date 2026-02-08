/**
 * SqliteAudienceUpdatedProjector - SQLite projector for AudienceUpdatedEvent event.
 *
 * Implements IAudienceUpdatedProjector for projecting audience update events
 * to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IAudienceUpdatedProjector } from "../../../application/audiences/update/IAudienceUpdatedProjector.js";
import { AudienceUpdatedEvent } from "../../../domain/audiences/update/AudienceUpdatedEvent.js";

export class SqliteAudienceUpdatedProjector implements IAudienceUpdatedProjector {
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
}
