import { UpdateArchitectureCommand } from "./UpdateArchitectureCommand.js";
import { IArchitectureUpdatedEventWriter } from "./IArchitectureUpdatedEventWriter.js";
import { IArchitectureUpdatedEventReader } from "./IArchitectureUpdatedEventReader.js";
import { IEventBus } from "../../messaging/IEventBus.js";
import { Architecture } from "../../../domain/architecture/Architecture.js";
import { ArchitectureErrorMessages } from "../../../domain/architecture/Constants.js";

export class UpdateArchitectureCommandHandler {
  constructor(
    private readonly eventWriter: IArchitectureUpdatedEventWriter,
    private readonly eventReader: IArchitectureUpdatedEventReader,
    private readonly eventBus: IEventBus
  ) {}

  async execute(command: UpdateArchitectureCommand): Promise<void> {
    const architectureId = 'architecture'; // Single architecture per project

    // 1. Load aggregate from event store
    const history = await this.eventReader.readStream(architectureId);
    if (history.length === 0) {
      throw new Error(ArchitectureErrorMessages.NOT_DEFINED);
    }

    // 2. Rehydrate aggregate
    const architecture = Architecture.rehydrate(architectureId, history as any);

    // 3. Domain logic produces event
    const event = architecture.update({
      description: command.description,
      organization: command.organization,
      patterns: command.patterns,
      principles: command.principles,
      dataStores: command.dataStores,
      stack: command.stack
    });

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);
  }
}
