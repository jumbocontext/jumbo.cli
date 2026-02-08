/**
 * ComponentAdded Event
 *
 * Emitted when a new component is added to the system.
 * This is the first event in the Component aggregate's lifecycle.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { ComponentTypeValue, ComponentStatusValue } from "../Constants.js";

export interface ComponentAddedEvent extends BaseEvent {
  readonly type: "ComponentAddedEvent";
  readonly payload: {
    readonly name: string;
    readonly type: ComponentTypeValue;
    readonly description: string;
    readonly responsibility: string;
    readonly path: string;
    readonly status: ComponentStatusValue;
  };
}
