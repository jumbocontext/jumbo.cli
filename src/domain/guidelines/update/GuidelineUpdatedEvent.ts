/**
 * GuidelineUpdated Event
 *
 * Emitted when a guideline is updated.
 * Supports partial updates - only provided fields are changed.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { GuidelineCategoryValue } from "../Constants.js";

export interface GuidelineUpdatedEvent extends BaseEvent {
  readonly type: "GuidelineUpdatedEvent";
  readonly payload: {
    readonly category?: GuidelineCategoryValue;
    readonly title?: string;
    readonly description?: string;
    readonly rationale?: string;
    readonly enforcement?: string;
    readonly examples?: string[];
  };
}
