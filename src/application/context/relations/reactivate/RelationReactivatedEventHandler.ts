import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { RelationReactivatedEvent } from "../../../../domain/relations/reactivate/RelationReactivatedEvent.js";
import { IRelationReactivatedProjector } from "./IRelationReactivatedProjector.js";

export class RelationReactivatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IRelationReactivatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const relationReactivatedEvent = event as RelationReactivatedEvent;
    await this.projector.applyRelationReactivated(relationReactivatedEvent);
  }
}
