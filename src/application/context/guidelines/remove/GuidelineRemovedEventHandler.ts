import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { GuidelineRemovedEvent } from "../../../../domain/guidelines/remove/GuidelineRemovedEvent.js";
import { IGuidelineRemovedProjector } from "./IGuidelineRemovedProjector.js";

/**
 * Event handler for GuidelineRemovedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a guideline is removed. Subscribes to GuidelineRemovedEvent via event bus.
 */
export class GuidelineRemovedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGuidelineRemovedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const guidelineRemovedEvent = event as GuidelineRemovedEvent;
    await this.projector.applyGuidelineRemoved(guidelineRemovedEvent);
  }
}
