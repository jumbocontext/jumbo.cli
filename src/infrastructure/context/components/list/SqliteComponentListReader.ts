/**
 * SqliteComponentListReader - SQLite reader for listing components.
 *
 * Implements IComponentListReader for retrieving component list
 * from the SQLite read model with optional status filtering.
 */

import { Database } from "better-sqlite3";
import { IComponentListReader, ComponentStatusFilter } from "../../../../application/context/components/list/IComponentListReader.js";
import { ComponentView } from "../../../../application/context/components/ComponentView.js";
import { ComponentTypeValue, ComponentStatusValue } from "../../../../domain/components/Constants.js";

export class SqliteComponentListReader implements IComponentListReader {
  constructor(private db: Database) {}

  async findAll(status: ComponentStatusFilter = "all"): Promise<ComponentView[]> {
    let query = "SELECT * FROM component_views";
    const params: string[] = [];

    if (status !== "all") {
      query += " WHERE status = ?";
      params.push(status);
    }

    query += " ORDER BY name";

    const rows = this.db.prepare(query).all(...params);
    return rows.map((row) => this.mapRowToView(row as Record<string, unknown>));
  }

  private mapRowToView(row: Record<string, unknown>): ComponentView {
    return {
      componentId: row.componentId as string,
      name: row.name as string,
      type: row.type as ComponentTypeValue,
      description: row.description as string,
      responsibility: row.responsibility as string,
      path: row.path as string,
      status: row.status as ComponentStatusValue,
      deprecationReason: (row.deprecationReason as string) ?? null,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
