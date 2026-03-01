import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { RelationDeactivatedEvent } from "../../../../domain/relations/deactivate/RelationDeactivatedEvent.js";
import { IRelationDeactivatedProjector } from "./IRelationDeactivatedProjector.js";

export class RelationDeactivatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IRelationDeactivatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const relationDeactivatedEvent = event as RelationDeactivatedEvent;
    await this.projector.applyRelationDeactivated(relationDeactivatedEvent);
  }
}
