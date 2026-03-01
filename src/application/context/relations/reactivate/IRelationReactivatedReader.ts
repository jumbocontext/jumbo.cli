import { RelationView } from "../RelationView.js";

export interface IRelationReactivatedReader {
  findById(id: string): Promise<RelationView | null>;
}
