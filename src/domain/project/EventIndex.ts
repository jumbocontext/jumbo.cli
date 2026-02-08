export * from "./init/ProjectInitializedEvent.js";
export * from "./update/ProjectUpdatedEvent.js";

import { ProjectInitializedEvent } from "./init/ProjectInitializedEvent.js";
import { ProjectUpdatedEvent } from "./update/ProjectUpdatedEvent.js";

// Union type will expand as we add more events
export type ProjectEvent = ProjectInitializedEvent | ProjectUpdatedEvent;
