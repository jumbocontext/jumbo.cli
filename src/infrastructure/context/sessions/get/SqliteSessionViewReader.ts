/**
 * SqliteSessionViewReader - SQLite reader for listing sessions.
 *
 * Implements ISessionViewReader for retrieving session history
 * from the SQLite read model with optional status filtering.
 */

import { Database } from "better-sqlite3";
import { ISessionViewReader, SessionStatusFilter } from "../../../../application/context/sessions/get/ISessionViewReader.js";
import { SessionView } from "../../../../application/context/sessions/SessionView.js";

export class SqliteSessionViewReader implements ISessionViewReader {
  constructor(private db: Database) {}

  async findAll(status: SessionStatusFilter = "all"): Promise<SessionView[]> {
    let query = "SELECT * FROM session_views";
    const params: string[] = [];

    if (status !== "all") {
      query += " WHERE status = ?";
      params.push(status);
    }

    query += " ORDER BY createdAt DESC";

    const rows = this.db.prepare(query).all(...params);
    return rows.map((row) => this.mapRowToView(row as Record<string, unknown>));
  }

  private mapRowToView(row: Record<string, unknown>): SessionView {
    return {
      sessionId: row.sessionId as string,
      focus: (row.focus as string) ?? null,
      status: row.status as SessionView["status"],
      contextSnapshot: (row.contextSnapshot as string) ?? null,
      version: row.version as number,
      startedAt: row.startedAt as string,
      endedAt: (row.endedAt as string) ?? null,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
