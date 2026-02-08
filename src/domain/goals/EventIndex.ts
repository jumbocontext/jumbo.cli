export * from "./add/GoalAddedEvent.js";
export * from "./block/GoalBlockedEvent.js";
export * from "./complete/GoalCompletedEvent.js";
export * from "./pause/GoalPausedEvent.js";
export * from "./remove/GoalRemovedEvent.js";
export * from "./reset/GoalResetEvent.js";
export * from "./resume/GoalResumedEvent.js";
export * from "./start/GoalStartedEvent.js";
export * from "./unblock/GoalUnblockedEvent.js";
export * from "./update/GoalUpdatedEvent.js";
export * from "./update-progress/GoalProgressUpdatedEvent.js";
export * from "./review/GoalSubmittedForReviewEvent.js";
export * from "./qualify/GoalQualifiedEvent.js";

import { GoalAddedEvent} from "./add/GoalAddedEvent.js";
import { GoalBlockedEvent} from "./block/GoalBlockedEvent.js";
import { GoalCompletedEvent} from "./complete/GoalCompletedEvent.js";
import { GoalPausedEvent} from "./pause/GoalPausedEvent.js";
import { GoalRemovedEvent} from "./remove/GoalRemovedEvent.js";
import { GoalResetEvent} from "./reset/GoalResetEvent.js";
import { GoalResumedEvent} from "./resume/GoalResumedEvent.js";
import { GoalStartedEvent} from "./start/GoalStartedEvent.js";
import { GoalUnblockedEvent} from "./unblock/GoalUnblockedEvent.js";
import { GoalUpdatedEvent} from "./update/GoalUpdatedEvent.js";
import { GoalProgressUpdatedEvent} from "./update-progress/GoalProgressUpdatedEvent.js";
import { GoalSubmittedForReviewEvent} from "./review/GoalSubmittedForReviewEvent.js";
import { GoalQualifiedEvent} from "./qualify/GoalQualifiedEvent.js";

// Union type will expand as we add more events
export type GoalEvent =
    GoalAddedEvent |
    GoalBlockedEvent |
    GoalCompletedEvent |
    GoalPausedEvent |
    GoalProgressUpdatedEvent |
    GoalRemovedEvent |
    GoalResetEvent |
    GoalResumedEvent |
    GoalStartedEvent |
    GoalUnblockedEvent |
    GoalUpdatedEvent |
    GoalSubmittedForReviewEvent |
    GoalQualifiedEvent;