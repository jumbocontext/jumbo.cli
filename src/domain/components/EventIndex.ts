export * from "./add/ComponentAddedEvent.js";
export * from "./update/ComponentUpdatedEvent.js";
export * from "./deprecate/ComponentDeprecatedEvent.js";
export * from "./remove/ComponentRemovedEvent.js";

import { ComponentAddedEvent } from "./add/ComponentAddedEvent.js";
import { ComponentUpdatedEvent } from "./update/ComponentUpdatedEvent.js";
import { ComponentDeprecatedEvent } from "./deprecate/ComponentDeprecatedEvent.js";
import { ComponentRemovedEvent } from "./remove/ComponentRemovedEvent.js";

// Union type of all component events
export type ComponentEvent =
  | ComponentAddedEvent
  | ComponentUpdatedEvent
  | ComponentDeprecatedEvent
  | ComponentRemovedEvent;
