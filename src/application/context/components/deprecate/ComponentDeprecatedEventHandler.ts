import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { ComponentDeprecatedEvent } from "../../../../domain/components/deprecate/ComponentDeprecatedEvent.js";
import { IComponentDeprecatedProjector } from "./IComponentDeprecatedProjector.js";

export class ComponentDeprecatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IComponentDeprecatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const componentDeprecatedEvent = event as ComponentDeprecatedEvent;
    await this.projector.applyComponentDeprecated(componentDeprecatedEvent);
  }
}
