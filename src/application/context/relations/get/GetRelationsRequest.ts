import { EntityTypeValue } from "../../../../domain/relations/Constants.js";

export interface GetRelationsRequest {
  readonly entityType?: EntityTypeValue;
  readonly entityId?: string;
  readonly status: "active" | "removed" | "all";
}
