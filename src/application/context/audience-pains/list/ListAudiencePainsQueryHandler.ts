/**
 * ListAudiencePainsQueryHandler - Query handler for listing all active audience pains.
 *
 * This is a standard CQRS query handler that provides read access to
 * the AudiencePain projection for listing purposes.
 *
 * Usage:
 *   const query = new ListAudiencePainsQueryHandler(audiencePainContextReader);
 *   const pains = await query.execute();
 *
 * Returns:
 *   - Array of AudiencePainView for all active (non-resolved) pains
 *   - Empty array if no pains exist
 */

import { IAudiencePainContextReader } from "../query/IAudiencePainContextReader.js";
import { AudiencePainView } from "../AudiencePainView.js";

export class ListAudiencePainsQueryHandler {
  constructor(
    private readonly audiencePainContextReader: IAudiencePainContextReader
  ) {}

  /**
   * Execute query to retrieve all active audience pains.
   *
   * @returns Array of AudiencePainView sorted by creation date
   */
  async execute(): Promise<AudiencePainView[]> {
    return this.audiencePainContextReader.findAllActive();
  }
}
