/**
 * ListValuePropositionsQueryHandler - Query handler for listing all value propositions.
 *
 * This is a standard CQRS query handler that provides read access to
 * the ValueProposition projection for listing purposes.
 *
 * Usage:
 *   const query = new ListValuePropositionsQueryHandler(valuePropositionContextReader);
 *   const values = await query.execute();
 *
 * Returns:
 *   - Array of ValuePropositionView for all active value propositions
 *   - Empty array if no value propositions exist
 */

import { IValuePropositionContextReader } from "../query/IValuePropositionContextReader.js";
import { ValuePropositionView } from "../ValuePropositionView.js";

export class ListValuePropositionsQueryHandler {
  constructor(
    private readonly valuePropositionContextReader: IValuePropositionContextReader
  ) {}

  /**
   * Execute query to retrieve all value propositions.
   *
   * @returns Array of ValuePropositionView sorted by creation date
   */
  async execute(): Promise<ValuePropositionView[]> {
    return this.valuePropositionContextReader.findAllActive();
  }
}
