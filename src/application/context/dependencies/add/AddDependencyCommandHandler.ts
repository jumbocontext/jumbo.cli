import { AddDependencyCommand } from "./AddDependencyCommand.js";
import { IDependencyAddedEventWriter } from "./IDependencyAddedEventWriter.js";
import { IDependencyAddReader } from "./IDependencyAddReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Dependency } from "../../../../domain/dependencies/Dependency.js";

/**
 * Command handler for AddDependencyCommand.
 * Orchestrates the creation of a new dependency aggregate and event publication.
 */
export class AddDependencyCommandHandler {
  constructor(
    private readonly eventWriter: IDependencyAddedEventWriter,
    private readonly eventBus: IEventBus,
    private readonly dependencyReader: IDependencyAddReader
  ) {}

  async execute(command: AddDependencyCommand): Promise<{ dependencyId: string }> {
    // Generate deterministic ID based on consumer and provider
    const dependencyId = `dep_${command.consumerId}_${command.providerId}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // Check if dependency already exists (idempotent behavior)
    const existingDependency = await this.dependencyReader.findById(dependencyId);
    if (existingDependency) {
      // Silently succeed - idempotent operation
      return { dependencyId };
    }

    // 1. Create new aggregate
    const dependency = Dependency.create(dependencyId);

    // 2. Domain logic produces event
    const event = dependency.add(
      command.consumerId,
      command.providerId,
      command.endpoint,
      command.contract
    );

    // 3. Persist event to file store
    await this.eventWriter.append(event);

    // 4. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { dependencyId };
  }
}
