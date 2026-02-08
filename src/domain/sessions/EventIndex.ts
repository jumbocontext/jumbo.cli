export * from "./start/SessionStartedEvent.js";
export * from "./end/SessionEndedEvent.js";

import { SessionStartedEvent } from "./start/SessionStartedEvent.js";
import { SessionEndedEvent } from "./end/SessionEndedEvent.js";

// Union type will expand as we add more events
export type SessionEvent = SessionStartedEvent | SessionEndedEvent;
