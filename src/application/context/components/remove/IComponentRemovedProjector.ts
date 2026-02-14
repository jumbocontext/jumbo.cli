import { ComponentRemovedEvent } from "../../../../domain/components/remove/ComponentRemovedEvent.js";

export interface IComponentRemovedProjector {
  applyComponentRemoved(event: ComponentRemovedEvent): Promise<void>;
}
