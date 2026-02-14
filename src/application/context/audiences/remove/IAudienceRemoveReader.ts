import { AudienceView } from "../AudienceView.js";

/**
 * Port interface for reading audience data needed for removal.
 * Used by RemoveAudienceCommandHandler to verify audience exists.
 */
export interface IAudienceRemoveReader {
  findById(id: string): Promise<AudienceView | null>;
}
