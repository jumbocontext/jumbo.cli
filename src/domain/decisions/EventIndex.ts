export * from "./add/DecisionAddedEvent.js";
export * from "./update/DecisionUpdatedEvent.js";
export * from "./reverse/DecisionReversedEvent.js";
export * from "./supersede/DecisionSupersededEvent.js";

import { DecisionAddedEvent } from "./add/DecisionAddedEvent.js";
import { DecisionUpdatedEvent } from "./update/DecisionUpdatedEvent.js";
import { DecisionReversedEvent } from "./reverse/DecisionReversedEvent.js";
import { DecisionSupersededEvent } from "./supersede/DecisionSupersededEvent.js";

// Union type of all decision events
export type DecisionEvent =
  | DecisionAddedEvent
  | DecisionUpdatedEvent
  | DecisionReversedEvent
  | DecisionSupersededEvent;
