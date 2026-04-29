/**
 * SqliteInvariantViewReader - SQLite reader for listing invariants.
 *
 * Implements IInvariantViewReader for retrieving invariant list
 * from the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IInvariantViewReader } from "../../../../application/context/invariants/get/IInvariantViewReader.js";
import { InvariantView } from "../../../../application/context/invariants/InvariantView.js";
import { InvariantRecord } from "../InvariantRecord.js";
import { InvariantRecordMapper } from "../InvariantRecordMapper.js";

export class SqliteInvariantViewReader implements IInvariantViewReader {
  private readonly mapper = new InvariantRecordMapper();

  constructor(private db: Database) {}

  async findById(id: string): Promise<InvariantView | null> {
    const row = this.db
      .prepare("SELECT * FROM invariant_views WHERE invariantId = ?")
      .get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.mapper.toView(this.mapRowToRecord(row));
  }

  async findAll(): Promise<InvariantView[]> {
    const rows = this.db
      .prepare("SELECT * FROM invariant_views ORDER BY createdAt ASC")
      .all();
    return rows.map((row) => this.mapper.toView(this.mapRowToRecord(row as Record<string, unknown>)));
  }

  async findByIds(ids: string[]): Promise<InvariantView[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => "?").join(",");
    const query = `SELECT * FROM invariant_views WHERE invariantId IN (${placeholders}) ORDER BY createdAt ASC`;
    const rows = this.db.prepare(query).all(...ids);
    return rows.map((row) => this.mapper.toView(this.mapRowToRecord(row as Record<string, unknown>)));
  }

  private mapRowToRecord(row: Record<string, unknown>): InvariantRecord {
    return {
      id: row.invariantId as string,
      title: row.title as string,
      description: row.description as string,
      rationale: (row.rationale as string) ?? null,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
