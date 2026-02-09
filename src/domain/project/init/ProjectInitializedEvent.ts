/**
 * ProjectInitialized Event
 *
 * Emitted when a project is initialized.
 * This is the first event in the Project aggregate's lifecycle.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { ProjectEventType } from "../Constants.js";

export interface ProjectInitializedEvent extends BaseEvent {
  readonly type: typeof ProjectEventType.INITIALIZED;
  readonly payload: {
    readonly name: string;
    readonly purpose: string | null;
  };
}
