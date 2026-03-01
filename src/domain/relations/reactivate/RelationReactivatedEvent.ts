import { BaseEvent, ISO8601 } from "../../BaseEvent.js";
import { RelationEventType } from "../Constants.js";

export interface RelationReactivatedEvent extends BaseEvent {
  readonly type: typeof RelationEventType.REACTIVATED;
  readonly payload: {
    readonly reason: string;
    readonly reactivatedAt: ISO8601;
  };
}
