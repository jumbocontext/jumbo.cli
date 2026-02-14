/**
 * SqliteValuePropositionContextReader - SQLite reader for value proposition context queries.
 *
 * Implements IValuePropositionContextReader for reading active value propositions
 * from the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IValuePropositionContextReader } from "../../../../application/context/value-propositions/query/IValuePropositionContextReader.js";
import { ValuePropositionView } from "../../../../application/context/value-propositions/ValuePropositionView.js";

export class SqliteValuePropositionContextReader implements IValuePropositionContextReader {
  constructor(private db: Database) {}

  async findAllActive(): Promise<ValuePropositionView[]> {
    const rows = this.db
      .prepare("SELECT * FROM value_proposition_views ORDER BY createdAt ASC")
      .all();
    return rows.map((row) => this.mapRowToView(row as Record<string, unknown>));
  }

  private mapRowToView(row: Record<string, unknown>): ValuePropositionView {
    return {
      valuePropositionId: row.valuePropositionId as string,
      title: row.title as string,
      description: row.description as string,
      benefit: row.benefit as string,
      measurableOutcome: (row.measurableOutcome as string) ?? null,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
