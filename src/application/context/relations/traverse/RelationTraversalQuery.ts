import {
  EntityTypeValue,
  RelationStrengthValue,
} from "../../../../domain/relations/Constants.js";
import { RelationDirection } from "../get/RelationDirection.js";
import { RelationStatusFilter } from "../get/RelationStatusFilter.js";

export interface RelationTraversalQuery {
  readonly depth: number;
  readonly direction: RelationDirection;
  readonly relationType?: string;
  readonly relatedEntityType?: EntityTypeValue;
  readonly strength?: RelationStrengthValue;
  readonly status: RelationStatusFilter;
}
