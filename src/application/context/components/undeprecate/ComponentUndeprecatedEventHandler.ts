import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { ComponentUndeprecatedEvent } from "../../../../domain/components/undeprecate/ComponentUndeprecatedEvent.js";
import { IComponentUndeprecatedProjector } from "./IComponentUndeprecatedProjector.js";
import { RelationReactivationCascade } from "../../relations/reactivate/RelationReactivationCascade.js";
import { EntityType } from "../../../../domain/relations/Constants.js";

export class ComponentUndeprecatedEventHandler implements IEventHandler {
  constructor(
    private readonly projector: IComponentUndeprecatedProjector,
    private readonly relationReactivationCascade: RelationReactivationCascade
  ) {}

  async handle(event: BaseEvent): Promise<void> {
    const componentUndeprecatedEvent = event as ComponentUndeprecatedEvent;
    await this.projector.applyComponentUndeprecated(componentUndeprecatedEvent);
    await this.relationReactivationCascade.execute(
      EntityType.COMPONENT,
      componentUndeprecatedEvent.aggregateId,
      `Automatically reactivated because component ${componentUndeprecatedEvent.aggregateId} was undeprecated: ${componentUndeprecatedEvent.payload.reason}`
    );
  }
}
