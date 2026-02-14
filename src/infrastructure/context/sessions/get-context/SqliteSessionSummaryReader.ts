/**
 * SqliteSessionSummaryReader - SQLite reader for session summaries.
 *
 * Implements ISessionSummaryReader for reading session summary projections
 * from the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { ISessionSummaryReader } from "../../../../application/context/sessions/get-context/ISessionSummaryReader.js";
import { SessionSummaryProjection } from "../../../../application/context/sessions/SessionSummaryView.js";

export class SqliteSessionSummaryReader implements ISessionSummaryReader {
  constructor(private readonly db: Database) {}

  async findLatest(): Promise<SessionSummaryProjection | null> {
    // O(1) point-read via primary key using LATEST pattern
    const selectStatement = this.db.prepare(`
      SELECT * FROM session_summary_views
      WHERE session_id = 'LATEST'
    `);

    const sessionSummaryRow = selectStatement.get();
    return sessionSummaryRow
      ? this.mapRowToProjection(sessionSummaryRow as any)
      : null;
  }

  /**
   * Map database row to SessionSummaryProjection
   *
   * Deserializes JSON arrays for completed_work, blockers_encountered, decisions
   */
  private mapRowToProjection(row: any): SessionSummaryProjection {
    return {
      sessionId: row.session_id,
      originalSessionId: row.original_session_id,
      focus: row.focus,
      status: row.status,
      contextSnapshot: row.context_snapshot,
      completedGoals: JSON.parse(row.completed_work || "[]"),
      blockersEncountered: JSON.parse(row.blockers_encountered || "[]"),
      decisions: JSON.parse(row.decisions || "[]"),
      goalsStarted: JSON.parse(row.goals_started || "[]"),
      goalsPaused: JSON.parse(row.goals_paused || "[]"),
      goalsResumed: JSON.parse(row.goals_resumed || "[]"),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
