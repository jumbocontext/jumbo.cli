import { AudiencePainView } from "../AudiencePainView.js";

/**
 * Port interface for reading audience pain data needed for updates.
 * Used by UpdateAudiencePainCommandHandler to verify pain exists.
 */
export interface IAudiencePainUpdateReader {
  findById(id: string): Promise<AudiencePainView | null>;
}
