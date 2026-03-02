import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { ComponentRemovedEvent } from "../../../../domain/components/remove/ComponentRemovedEvent.js";
import { IComponentRemovedProjector } from "./IComponentRemovedProjector.js";
import { RelationDeactivationCascade } from "../../relations/deactivate/RelationDeactivationCascade.js";
import { EntityType } from "../../../../domain/relations/Constants.js";

export class ComponentRemovedEventHandler implements IEventHandler {
  constructor(
    private readonly projector: IComponentRemovedProjector,
    private readonly relationDeactivationCascade: RelationDeactivationCascade
  ) {}

  async handle(event: BaseEvent): Promise<void> {
    const componentRemovedEvent = event as ComponentRemovedEvent;
    await this.projector.applyComponentRemoved(componentRemovedEvent);
    await this.relationDeactivationCascade.execute(
      EntityType.COMPONENT,
      componentRemovedEvent.aggregateId,
      `Automatically deactivated because component ${componentRemovedEvent.aggregateId} was removed`
    );
  }
}
