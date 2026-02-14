import { ComponentAddedEvent } from "../../../../domain/components/add/ComponentAddedEvent.js";

export interface IComponentAddedProjector {
  applyComponentAdded(event: ComponentAddedEvent): Promise<void>;
}
