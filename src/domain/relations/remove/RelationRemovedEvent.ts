import { BaseEvent } from "../../BaseEvent.js";
import { EntityTypeValue } from "../Constants.js";

/**
 * Emitted when a relation between two entities is removed from the knowledge graph.
 * Part of Task-41 (relation.remove flow)
 */
export interface RelationRemovedEvent extends BaseEvent {
  readonly type: "RelationRemovedEvent";
  readonly payload: {
    readonly fromEntityType: EntityTypeValue;
    readonly fromEntityId: string;
    readonly toEntityType: EntityTypeValue;
    readonly toEntityId: string;
    readonly relationType: string;
    readonly reason?: string;
  };
}
