import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { ComponentUpdatedEvent } from "../../../../domain/components/update/ComponentUpdatedEvent.js";
import { IComponentUpdatedProjector } from "./IComponentUpdatedProjector.js";

export class ComponentUpdatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IComponentUpdatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const componentUpdatedEvent = event as ComponentUpdatedEvent;
    await this.projector.applyComponentUpdated(componentUpdatedEvent);
  }
}
