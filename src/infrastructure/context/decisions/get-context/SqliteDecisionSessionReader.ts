/**
 * SqliteDecisionSessionReader - SQLite reader for decision session queries.
 *
 * Implements IDecisionSessionReader for reading decisions
 * used by SessionSummaryProjectionHandler.
 */

import { Database } from "better-sqlite3";
import { IDecisionSessionReader } from "../../../../application/context/sessions/get-context/IDecisionSessionReader.js";
import { DecisionView } from "../../../../application/context/decisions/DecisionView.js";

export class SqliteDecisionSessionReader implements IDecisionSessionReader {
  constructor(private db: Database) {}

  async findById(id: string): Promise<DecisionView | null> {
    const row = this.db.prepare('SELECT * FROM decision_views WHERE decisionId = ?').get(id) as Record<string, unknown> | undefined;
    return row ? this.mapRowToView(row) : null;
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
