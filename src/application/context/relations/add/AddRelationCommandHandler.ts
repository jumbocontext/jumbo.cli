import { randomUUID } from "crypto";
import { AddRelationCommand } from "./AddRelationCommand.js";
import { IRelationAddedEventWriter } from "./IRelationAddedEventWriter.js";
import { IRelationAddedReader } from "./IRelationAddedReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Relation } from "../../../../domain/relations/Relation.js";

/**
 * Handles adding a new relation.
 * Creates a new relation aggregate, produces RelationAdded event, persists and publishes.
 * Implements idempotency: if identical relation exists, returns existing ID.
 */
export class AddRelationCommandHandler {
  constructor(
    private readonly eventWriter: IRelationAddedEventWriter,
    private readonly eventBus: IEventBus,
    private readonly reader: IRelationAddedReader
  ) {}

  async execute(command: AddRelationCommand): Promise<{ relationId: string }> {
    // Check if identical relation exists (idempotent behavior)
    const existingRelation = await this.reader.findByEntities(
      command.fromEntityType,
      command.fromEntityId,
      command.toEntityType,
      command.toEntityId,
      command.relationType
    );

    if (existingRelation) {
      // Relation already exists - idempotent: just return the existing ID
      return { relationId: existingRelation.relationId };
    }

    // Generate new relation ID
    const relationId = `relation_${randomUUID()}`;

    // Create new aggregate
    const relation = Relation.create(relationId);

    // Domain logic produces event
    const event = relation.add(
      command.fromEntityType,
      command.fromEntityId,
      command.toEntityType,
      command.toEntityId,
      command.relationType,
      command.description,
      command.strength
    );

    // Persist event to file store
    await this.eventWriter.append(event);

    // Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { relationId };
  }
}
