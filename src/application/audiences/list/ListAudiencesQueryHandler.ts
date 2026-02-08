/**
 * ListAudiencesQueryHandler - Query handler for listing all active audiences.
 *
 * This is a standard CQRS query handler that provides read access to
 * the Audience projection for listing purposes.
 *
 * Usage:
 *   const query = new ListAudiencesQueryHandler(audienceContextReader);
 *   const audiences = await query.execute();
 *
 * Returns:
 *   - Array of AudienceView for all active (non-removed) audiences
 *   - Empty array if no audiences exist
 */

import { IAudienceContextReader } from "../query/IAudienceContextReader.js";
import { AudienceView } from "../AudienceView.js";

export class ListAudiencesQueryHandler {
  constructor(
    private readonly audienceContextReader: IAudienceContextReader
  ) {}

  /**
   * Execute query to retrieve all active audiences.
   *
   * @returns Array of AudienceView sorted by priority and creation date
   */
  async execute(): Promise<AudienceView[]> {
    return this.audienceContextReader.findAllActive();
  }
}
