/**
 * ArchitectureDefined Event
 *
 * Emitted when architecture is defined.
 * This is the first event in the Architecture aggregate's lifecycle.
 */

import { BaseEvent } from "../../BaseEvent.js";

export interface DataStore {
  readonly name: string;
  readonly type: string;
  readonly purpose: string;
}

export interface ArchitectureDefinedEvent extends BaseEvent {
  readonly type: "ArchitectureDefinedEvent";
  readonly payload: {
    readonly description: string;
    readonly organization: string;
    readonly patterns: string[];
    readonly principles: string[];
    readonly dataStores: DataStore[];
    readonly stack: string[];
  };
}
