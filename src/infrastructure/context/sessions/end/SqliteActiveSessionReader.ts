/**
 * SqliteActiveSessionReader - SQLite reader for active session.
 *
 * Implements IActiveSessionReader for finding the currently active session
 * from the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IActiveSessionReader } from "../../../../application/context/sessions/end/IActiveSessionReader.js";
import { SessionView } from "../../../../application/context/sessions/SessionView.js";

export class SqliteActiveSessionReader implements IActiveSessionReader {
  constructor(private db: Database) {}

  async findActive(): Promise<SessionView | null> {
    const row = this.db
      .prepare(
        "SELECT * FROM session_views WHERE status IN ('active', 'paused') ORDER BY createdAt DESC LIMIT 1"
      )
      .get();
    return row ? this.mapRowToView(row as any) : null;
  }

  private mapRowToView(row: any): SessionView {
    return {
      sessionId: row.sessionId,
      focus: row.focus ?? null,
      status: row.status,
      contextSnapshot: row.contextSnapshot ?? null,
      version: row.version,
      startedAt: row.startedAt,
      endedAt: row.endedAt ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
