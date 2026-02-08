export * from "./add/AudiencePainAddedEvent.js";
export * from "./update/AudiencePainUpdatedEvent.js";
export * from "./resolve/AudiencePainResolvedEvent.js";

import { AudiencePainAddedEvent } from "./add/AudiencePainAddedEvent.js";
import { AudiencePainUpdatedEvent } from "./update/AudiencePainUpdatedEvent.js";
import { AudiencePainResolvedEvent } from "./resolve/AudiencePainResolvedEvent.js";

// Union type of all audience pain events
export type AudiencePainEvent = AudiencePainAddedEvent | AudiencePainUpdatedEvent | AudiencePainResolvedEvent;
