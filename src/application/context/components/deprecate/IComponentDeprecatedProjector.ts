import { ComponentDeprecatedEvent } from "../../../../domain/components/deprecate/ComponentDeprecatedEvent.js";

export interface IComponentDeprecatedProjector {
  applyComponentDeprecated(event: ComponentDeprecatedEvent): Promise<void>;
}
