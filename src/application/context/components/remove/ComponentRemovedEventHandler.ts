import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { ComponentRemovedEvent } from "../../../../domain/components/remove/ComponentRemovedEvent.js";
import { IComponentRemovedProjector } from "./IComponentRemovedProjector.js";

export class ComponentRemovedEventHandler implements IEventHandler {
  constructor(private readonly projector: IComponentRemovedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const componentRemovedEvent = event as ComponentRemovedEvent;
    await this.projector.applyComponentRemoved(componentRemovedEvent);
  }
}
