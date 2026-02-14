import { ComponentUpdatedEvent } from "../../../../domain/components/update/ComponentUpdatedEvent.js";

export interface IComponentUpdatedProjector {
  applyComponentUpdated(event: ComponentUpdatedEvent): Promise<void>;
}
