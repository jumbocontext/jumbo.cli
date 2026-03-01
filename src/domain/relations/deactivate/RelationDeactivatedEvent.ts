import { BaseEvent, ISO8601 } from "../../BaseEvent.js";
import { RelationEventType } from "../Constants.js";

export interface RelationDeactivatedEvent extends BaseEvent {
  readonly type: typeof RelationEventType.DEACTIVATED;
  readonly payload: {
    readonly reason: string;
    readonly deactivatedAt: ISO8601;
  };
}
