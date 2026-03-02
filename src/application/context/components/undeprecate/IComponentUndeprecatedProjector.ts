import { ComponentUndeprecatedEvent } from "../../../../domain/components/undeprecate/ComponentUndeprecatedEvent.js";

export interface IComponentUndeprecatedProjector {
  applyComponentUndeprecated(event: ComponentUndeprecatedEvent): Promise<void>;
}
