/**
 * GuidelineUpdated Event
 *
 * Emitted when a guideline is updated.
 * Supports partial updates - only provided fields are changed.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { GuidelineCategoryValue, GuidelineEventType } from "../Constants.js";

export interface GuidelineUpdatedEvent extends BaseEvent {
  readonly type: typeof GuidelineEventType.UPDATED;
  readonly payload: {
    readonly category?: GuidelineCategoryValue;
    readonly title?: string;
    readonly description?: string;
    readonly rationale?: string;
    readonly examples?: string[];
  };
}
