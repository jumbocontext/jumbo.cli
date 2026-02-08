/**
 * SqliteInvariantContextReader - SQLite reader for invariant context queries.
 */

import { Database } from "better-sqlite3";
import { IInvariantContextReader } from "../../../application/goals/get-context/IInvariantContextReader.js";
import { InvariantView } from "../../../application/invariants/InvariantView.js";

export class SqliteInvariantContextReader implements IInvariantContextReader {
  constructor(private db: Database) {}

  async findAll(): Promise<InvariantView[]> {
    const rows = this.db
      .prepare("SELECT * FROM invariant_views ORDER BY createdAt ASC")
      .all();
    return rows.map((row) => this.mapRowToView(row as Record<string, unknown>));
  }

  private mapRowToView(row: Record<string, unknown>): InvariantView {
    return {
      invariantId: row.invariantId as string,
      title: row.title as string,
      description: row.description as string,
      rationale: (row.rationale as string) ?? null,
      enforcement: row.enforcement as string,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
