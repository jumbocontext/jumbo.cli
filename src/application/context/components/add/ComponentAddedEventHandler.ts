import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { ComponentAddedEvent } from "../../../../domain/components/add/ComponentAddedEvent.js";
import { IComponentAddedProjector } from "./IComponentAddedProjector.js";

export class ComponentAddedEventHandler implements IEventHandler {
  constructor(private readonly projector: IComponentAddedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const componentAddedEvent = event as ComponentAddedEvent;
    await this.projector.applyComponentAdded(componentAddedEvent);
  }
}
