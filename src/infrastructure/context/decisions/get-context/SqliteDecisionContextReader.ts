/**
 * SqliteDecisionContextReader - SQLite reader for decision context queries.
 *
 * Implements IDecisionContextReader for reading active decisions
 * used by GetGoalContextQueryHandler.
 */

import { Database } from "better-sqlite3";
import { IDecisionContextReader } from "../../../../application/context/goals/get-context/IDecisionContextReader.js";
import { DecisionView } from "../../../../application/context/decisions/DecisionView.js";

export class SqliteDecisionContextReader implements IDecisionContextReader {
  constructor(private db: Database) {}

  async findAllActive(): Promise<DecisionView[]> {
    const rows = this.db.prepare("SELECT * FROM decision_views WHERE status = 'active' ORDER BY createdAt DESC").all();
    return rows.map((row: unknown) => this.mapRowToView(row as Record<string, unknown>));
  }

  async findByIds(ids: string[]): Promise<DecisionView[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => '?').join(',');
    const query = `SELECT * FROM decision_views WHERE decisionId IN (${placeholders}) ORDER BY createdAt DESC`;
    const rows = this.db.prepare(query).all(...ids);
    return rows.map((row: unknown) => this.mapRowToView(row as Record<string, unknown>));
  }

  private mapRowToView(row: Record<string, unknown>): DecisionView {
    return {
      decisionId: row.decisionId as string,
      title: row.title as string,
      context: row.context as string,
      rationale: (row.rationale as string) ?? null,
      alternatives: JSON.parse((row.alternatives as string) || '[]'),
      consequences: (row.consequences as string) ?? null,
      status: row.status as DecisionView['status'],
      supersededBy: (row.supersededBy as string) ?? null,
      reversalReason: (row.reversalReason as string) ?? null,
      reversedAt: (row.reversedAt as string) ?? null,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
