import { RelationView } from "../RelationView.js";

/**
 * Port interface for reading relation data needed by RemoveRelationCommandHandler.
 * Used to check if relation exists and its current status.
 */
export interface IRelationRemovedReader {
  findById(id: string): Promise<RelationView | null>;
}
