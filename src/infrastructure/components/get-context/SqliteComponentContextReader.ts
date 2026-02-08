/**
 * SqliteComponentContextReader - SQLite reader for component context queries.
 *
 * Implements IComponentContextReader for reading active components
 * used by GetGoalContextQueryHandler.
 */

import { Database } from "better-sqlite3";
import { IComponentContextReader } from "../../../application/goals/get-context/IComponentContextReader.js";
import { ComponentView } from "../../../application/components/ComponentView.js";
import { ComponentTypeValue, ComponentStatusValue } from "../../../domain/components/Constants.js";

export class SqliteComponentContextReader implements IComponentContextReader {
  constructor(private db: Database) {}

  async findAll(): Promise<ComponentView[]> {
    const rows = this.db.prepare('SELECT * FROM component_views ORDER BY name').all();
    return rows.map(row => this.mapRowToView(row as Record<string, unknown>));
  }

  async findByStatus(status: string): Promise<ComponentView[]> {
    const rows = this.db
      .prepare('SELECT * FROM component_views WHERE status = ? ORDER BY name')
      .all(status);
    return rows.map(row => this.mapRowToView(row as Record<string, unknown>));
  }

  async findByType(type: string): Promise<ComponentView[]> {
    const rows = this.db
      .prepare('SELECT * FROM component_views WHERE type = ? ORDER BY name')
      .all(type);
    return rows.map(row => this.mapRowToView(row as Record<string, unknown>));
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
