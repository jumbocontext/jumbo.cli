/**
 * SqliteDecisionListReader - SQLite reader for listing decisions.
 *
 * Implements IDecisionListReader for retrieving decision list
 * from the SQLite read model with optional status filtering.
 */

import { Database } from "better-sqlite3";
import { IDecisionListReader, DecisionStatusFilter } from "../../../application/decisions/list/IDecisionListReader.js";
import { DecisionView } from "../../../application/decisions/DecisionView.js";

export class SqliteDecisionListReader implements IDecisionListReader {
  constructor(private db: Database) {}

  async findAll(status: DecisionStatusFilter = "all"): Promise<DecisionView[]> {
    let query = "SELECT * FROM decision_views";
    const params: string[] = [];

    if (status !== "all") {
      query += " WHERE status = ?";
      params.push(status);
    }

    query += " ORDER BY createdAt DESC";

    const rows = this.db.prepare(query).all(...params);
    return rows.map((row) => this.mapRowToView(row as Record<string, unknown>));
  }

  private mapRowToView(row: Record<string, unknown>): DecisionView {
    return {
      decisionId: row.decisionId as string,
      title: row.title as string,
      context: row.context as string,
      rationale: (row.rationale as string) ?? null,
      alternatives: JSON.parse((row.alternatives as string) || "[]"),
      consequences: (row.consequences as string) ?? null,
      status: row.status as DecisionView["status"],
      supersededBy: (row.supersededBy as string) ?? null,
      reversalReason: (row.reversalReason as string) ?? null,
      reversedAt: (row.reversedAt as string) ?? null,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
