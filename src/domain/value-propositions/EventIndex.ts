export * from "./add/ValuePropositionAddedEvent.js";
export * from "./update/ValuePropositionUpdatedEvent.js";
export * from "./remove/ValuePropositionRemovedEvent.js";

import { ValuePropositionAddedEvent } from "./add/ValuePropositionAddedEvent.js";
import { ValuePropositionUpdatedEvent } from "./update/ValuePropositionUpdatedEvent.js";
import { ValuePropositionRemovedEvent } from "./remove/ValuePropositionRemovedEvent.js";

// Union type will expand as we add more events
export type ValuePropositionEvent =
  | ValuePropositionAddedEvent
  | ValuePropositionUpdatedEvent
  | ValuePropositionRemovedEvent;
