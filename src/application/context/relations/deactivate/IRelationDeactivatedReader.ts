import { RelationView } from "../RelationView.js";

export interface IRelationDeactivatedReader {
  findById(id: string): Promise<RelationView | null>;
}
