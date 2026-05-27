import { BaseEvent } from "../../BaseEvent.js";
import {
  EntityTypeValue,
  RelationEventType,
  RelationStrengthValue,
} from "../Constants.js";

/**
 * Emitted when a relation between two entities is added to the knowledge graph.
 * This is the first (and only lifecycle) event for the Relation aggregate.
 */
export interface RelationAddedEvent extends BaseEvent {
  readonly type: typeof RelationEventType.ADDED;
  readonly payload: {
    readonly fromEntityType: EntityTypeValue;
    readonly fromEntityId: string;
    readonly toEntityType: EntityTypeValue;
    readonly toEntityId: string;
    readonly relationType: string;
    readonly strength: RelationStrengthValue | null;
    readonly description: string;
  };
}
