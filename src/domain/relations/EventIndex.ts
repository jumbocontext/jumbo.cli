export * from "./add/RelationAddedEvent.js";
export * from "./deactivate/RelationDeactivatedEvent.js";
export * from "./reactivate/RelationReactivatedEvent.js";
export * from "./remove/RelationRemovedEvent.js";

import { RelationAddedEvent } from "./add/RelationAddedEvent.js";
import { RelationDeactivatedEvent } from "./deactivate/RelationDeactivatedEvent.js";
import { RelationReactivatedEvent } from "./reactivate/RelationReactivatedEvent.js";
import { RelationRemovedEvent } from "./remove/RelationRemovedEvent.js";

// Union type will expand as we add more events
export type RelationEvent =
  | RelationAddedEvent
  | RelationDeactivatedEvent
  | RelationReactivatedEvent
  | RelationRemovedEvent;
