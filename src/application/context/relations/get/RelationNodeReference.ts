import { EntityTypeValue } from "../../../../domain/relations/Constants.js";

export interface RelationNodeReference {
  readonly entityType: EntityTypeValue;
  readonly entityId: string;
}
