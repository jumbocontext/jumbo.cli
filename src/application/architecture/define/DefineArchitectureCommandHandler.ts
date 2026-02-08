import { DefineArchitectureCommand } from "./DefineArchitectureCommand.js";
import { IArchitectureDefinedEventWriter } from "./IArchitectureDefinedEventWriter.js";
import { IArchitectureDefineReader } from "./IArchitectureDefineReader.js";
import { IEventBus } from "../../messaging/IEventBus.js";
import { Architecture } from "../../../domain/architecture/Architecture.js";
import { ArchitectureErrorMessages } from "../../../domain/architecture/Constants.js";

export class DefineArchitectureCommandHandler {
  constructor(
    private readonly eventWriter: IArchitectureDefinedEventWriter,
    private readonly architectureReader: IArchitectureDefineReader,
    private readonly eventBus: IEventBus
  ) {}

  async execute(command: DefineArchitectureCommand): Promise<{ architectureId: string }> {
    // Check if architecture already exists (precondition)
    const existingArchitecture = await this.architectureReader.findById('architecture');
    if (existingArchitecture) {
      throw new Error(ArchitectureErrorMessages.ALREADY_DEFINED);
    }

    // 1. Create new aggregate
    const architectureId = 'architecture'; // Single architecture per project
    const architecture = Architecture.create(architectureId);

    // 2. Domain logic produces event
    const event = architecture.define(
      command.description,
      command.organization,
      command.patterns,
      command.principles,
      command.dataStores,
      command.stack
    );

    // 3. Persist event to file store
    await this.eventWriter.append(event);

    // 4. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { architectureId };
  }
}
