/**
 * ArchitectureUpdated Event
 *
 * Emitted when architecture details are updated.
 * Contains partial updates - undefined fields mean no change.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { DataStore } from "../define/ArchitectureDefinedEvent.js";

export interface ArchitectureUpdatedEvent extends BaseEvent {
  readonly type: "ArchitectureUpdatedEvent";
  readonly payload: {
    readonly description?: string;
    readonly organization?: string;
    readonly patterns?: string[];
    readonly principles?: string[];
    readonly dataStores?: DataStore[];
    readonly stack?: string[];
  };
}
