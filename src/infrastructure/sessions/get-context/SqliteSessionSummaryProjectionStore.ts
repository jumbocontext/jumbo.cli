/**
 * SqliteSessionSummaryProjectionStore - Persists SessionSummary projection to SQLite
 *
 * Implements the "LATEST" pattern for O(1) context retrieval:
 * - Most recent session always stored with session_id='LATEST'
 * - Historical sessions stored with their original UUIDs
 * - archiveLatest() clones LATEST to permanent ID when starting new session
 */

import { Database } from "better-sqlite3";
import { ISessionSummaryProjectionStore } from "../../../application/sessions/get-context/ISessionSummaryProjectionStore.js";
import {
  SessionSummaryProjection,
  GoalReference,
  BlockerReference,
  DecisionReference,
  GoalStartedReference,
  GoalPausedReference,
  GoalResumedReference,
} from "../../../application/sessions/SessionSummaryView.js";

export class SqliteSessionSummaryProjectionStore
  implements ISessionSummaryProjectionStore
{
  constructor(private readonly db: Database) {}

  async upsertLatest(summary: SessionSummaryProjection): Promise<void> {
    const upsertStatement = this.db.prepare(`
      INSERT OR REPLACE INTO session_summary_views (
        session_id, original_session_id, focus, status, context_snapshot,
        completed_work, blockers_encountered, decisions,
        goals_started, goals_paused, goals_resumed,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    upsertStatement.run(
      "LATEST",
      summary.originalSessionId,
      summary.focus,
      summary.status,
      summary.contextSnapshot,
      JSON.stringify(summary.completedGoals),
      JSON.stringify(summary.blockersEncountered),
      JSON.stringify(summary.decisions),
      JSON.stringify(summary.goalsStarted),
      JSON.stringify(summary.goalsPaused),
      JSON.stringify(summary.goalsResumed),
      summary.createdAt,
      summary.updatedAt
    );
  }

  async archiveLatest(): Promise<void> {
    // Get current LATEST
    const latestSessionSummary = await this.findLatest();
    if (!latestSessionSummary || latestSessionSummary.status !== "ended") {
      // Nothing to archive - either no LATEST exists or it's not ended yet
      return;
    }

    // Clone LATEST to permanent ID (using original_session_id)
    const insertStatement = this.db.prepare(`
      INSERT OR IGNORE INTO session_summary_views (
        session_id, original_session_id, focus, status, context_snapshot,
        completed_work, blockers_encountered, decisions,
        goals_started, goals_paused, goals_resumed,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStatement.run(
      latestSessionSummary.originalSessionId, // Use original UUID as permanent session_id
      latestSessionSummary.originalSessionId,
      latestSessionSummary.focus,
      latestSessionSummary.status,
      latestSessionSummary.contextSnapshot,
      JSON.stringify(latestSessionSummary.completedGoals),
      JSON.stringify(latestSessionSummary.blockersEncountered),
      JSON.stringify(latestSessionSummary.decisions),
      JSON.stringify(latestSessionSummary.goalsStarted),
      JSON.stringify(latestSessionSummary.goalsPaused),
      JSON.stringify(latestSessionSummary.goalsResumed),
      latestSessionSummary.createdAt,
      latestSessionSummary.updatedAt
    );
  }

  async update(
    sessionId: string,
    updates: Partial<SessionSummaryProjection>
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    // Build dynamic UPDATE statement based on provided fields
    if (updates.status !== undefined) {
      fields.push("status = ?");
      values.push(updates.status);
    }
    if (updates.updatedAt !== undefined) {
      fields.push("updated_at = ?");
      values.push(updates.updatedAt);
    }

    if (fields.length === 0) {
      // Nothing to update
      return;
    }

    values.push(sessionId); // WHERE clause parameter

    const updateStatement = this.db.prepare(`
      UPDATE session_summary_views
      SET ${fields.join(", ")}
      WHERE session_id = ?
    `);

    updateStatement.run(...values);
  }

  async addCompletedGoal(goalReference: GoalReference): Promise<void> {
    const latestSessionSummary = await this.findLatest();
    if (!latestSessionSummary) {
      // No LATEST session exists - skip
      return;
    }

    // Append to completedGoals array
    const updatedCompletedGoals = [
      ...latestSessionSummary.completedGoals,
      goalReference,
    ];

    const updateStatement = this.db.prepare(`
      UPDATE session_summary_views
      SET completed_work = ?, updated_at = ?
      WHERE session_id = 'LATEST'
    `);

    updateStatement.run(
      JSON.stringify(updatedCompletedGoals),
      new Date().toISOString()
    );
  }

  async addBlocker(blocker: BlockerReference): Promise<void> {
    const latestSessionSummary = await this.findLatest();
    if (!latestSessionSummary) {
      // No LATEST session exists - skip
      return;
    }

    // Append to blockersEncountered array
    const updatedBlockers = [
      ...latestSessionSummary.blockersEncountered,
      blocker,
    ];

    const updateStatement = this.db.prepare(`
      UPDATE session_summary_views
      SET blockers_encountered = ?, updated_at = ?
      WHERE session_id = 'LATEST'
    `);

    updateStatement.run(JSON.stringify(updatedBlockers), new Date().toISOString());
  }

  async addDecision(decision: DecisionReference): Promise<void> {
    const latestSessionSummary = await this.findLatest();
    if (!latestSessionSummary) {
      // No LATEST session exists - skip
      return;
    }

    // Append to decisions array
    const updatedDecisions = [...latestSessionSummary.decisions, decision];

    const updateStatement = this.db.prepare(`
      UPDATE session_summary_views
      SET decisions = ?, updated_at = ?
      WHERE session_id = 'LATEST'
    `);

    updateStatement.run(
      JSON.stringify(updatedDecisions),
      new Date().toISOString()
    );
  }

  async addStartedGoal(goalReference: GoalStartedReference): Promise<void> {
    const latestSessionSummary = await this.findLatest();
    if (!latestSessionSummary) {
      // No LATEST session exists - skip
      return;
    }

    // Append to goalsStarted array
    const updatedGoalsStarted = [
      ...latestSessionSummary.goalsStarted,
      goalReference,
    ];

    const updateStatement = this.db.prepare(`
      UPDATE session_summary_views
      SET goals_started = ?, updated_at = ?
      WHERE session_id = 'LATEST'
    `);

    updateStatement.run(
      JSON.stringify(updatedGoalsStarted),
      new Date().toISOString()
    );
  }

  async addPausedGoal(goalReference: GoalPausedReference): Promise<void> {
    const latestSessionSummary = await this.findLatest();
    if (!latestSessionSummary) {
      // No LATEST session exists - skip
      return;
    }

    // Append to goalsPaused array
    const updatedGoalsPaused = [
      ...latestSessionSummary.goalsPaused,
      goalReference,
    ];

    const updateStatement = this.db.prepare(`
      UPDATE session_summary_views
      SET goals_paused = ?, updated_at = ?
      WHERE session_id = 'LATEST'
    `);

    updateStatement.run(
      JSON.stringify(updatedGoalsPaused),
      new Date().toISOString()
    );
  }

  async addResumedGoal(goalReference: GoalResumedReference): Promise<void> {
    const latestSessionSummary = await this.findLatest();
    if (!latestSessionSummary) {
      // No LATEST session exists - skip
      return;
    }

    // Append to goalsResumed array
    const updatedGoalsResumed = [
      ...latestSessionSummary.goalsResumed,
      goalReference,
    ];

    const updateStatement = this.db.prepare(`
      UPDATE session_summary_views
      SET goals_resumed = ?, updated_at = ?
      WHERE session_id = 'LATEST'
    `);

    updateStatement.run(
      JSON.stringify(updatedGoalsResumed),
      new Date().toISOString()
    );
  }

  async findLatest(): Promise<SessionSummaryProjection | null> {
    // O(1) point-read via primary key
    const selectStatement = this.db.prepare(`
      SELECT * FROM session_summary_views
      WHERE session_id = 'LATEST'
    `);

    const sessionSummaryRow = selectStatement.get();
    return sessionSummaryRow
      ? this.mapRowToProjection(sessionSummaryRow as any)
      : null;
  }

  async findByOriginalId(
    originalSessionId: string
  ): Promise<SessionSummaryProjection | null> {
    // Find archived (permanent) version where session_id equals original_session_id
    // This excludes LATEST which has session_id='LATEST'
    const selectStatement = this.db.prepare(`
      SELECT * FROM session_summary_views
      WHERE session_id = ? AND session_id = original_session_id
      LIMIT 1
    `);

    const sessionSummaryRow = selectStatement.get(originalSessionId);
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
