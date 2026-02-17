import { AudienceView } from "../AudienceView.js";

/**
 * Port interface for reading audience data needed for updates.
 * Used by LocalUpdateAudienceGateway to fetch the updated view after command execution.
 */
export interface IAudienceUpdateReader {
  findById(id: string): Promise<AudienceView | null>;
}
