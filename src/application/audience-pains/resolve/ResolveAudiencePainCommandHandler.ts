/**
 * ResolveAudiencePainCommandHandler - Command handler for resolving audience pains.
 *
 * This handler:
 * 1. Loads AudiencePain aggregate from event store
 * 2. Executes domain logic (resolve)
 * 3. Persists event to event store
 * 4. Publishes event to event bus for projection updates
 */

import { ResolveAudiencePainCommand } from "./ResolveAudiencePainCommand.js";
import { IAudiencePainResolvedEventWriter } from "./IAudiencePainResolvedEventWriter.js";
import { IEventBus } from "../../messaging/IEventBus.js";
import { AudiencePain } from "../../../domain/audience-pains/AudiencePain.js";
import { AudiencePainErrorMessages } from "../../../domain/audience-pains/Constants.js";

export class ResolveAudiencePainCommandHandler {
  constructor(
    private readonly eventWriter: IAudiencePainResolvedEventWriter,
    private readonly eventBus: IEventBus
  ) {}

  async execute(command: ResolveAudiencePainCommand): Promise<void> {
    // 1. Load aggregate from event store
    const history = await this.eventWriter.readStream(command.painId);
    if (history.length === 0) {
      throw new Error(AudiencePainErrorMessages.NOT_FOUND);
    }

    const pain = AudiencePain.rehydrate(command.painId, history as any);

    // 2. Domain logic produces event (will throw if already resolved)
    const event = pain.resolve(command.resolutionNotes);

    // 3. Persist event to file store
    await this.eventWriter.append(event);

    // 4. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);
  }
}
