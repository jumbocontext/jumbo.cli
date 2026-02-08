/**
 * ListDecisionsQueryHandler - Query handler for listing architectural decisions.
 *
 * This is a standard CQRS query handler that provides read access to
 * the Decision projection for listing purposes with optional filtering.
 *
 * Usage:
 *   const query = new ListDecisionsQueryHandler(decisionListReader);
 *   const decisions = await query.execute();
 *   const activeDecisions = await query.execute("active");
 *
 * Returns:
 *   - Array of DecisionView ordered by creation date (newest first)
 *   - Empty array if no decisions exist
 */

import { IDecisionListReader, DecisionStatusFilter } from "./IDecisionListReader.js";
import { DecisionView } from "../DecisionView.js";

export class ListDecisionsQueryHandler {
  constructor(
    private readonly decisionListReader: IDecisionListReader
  ) {}

  /**
   * Execute query to retrieve decisions.
   *
   * @param status - Optional filter by status ("active", "superseded", "reversed", "all")
   * @returns Array of DecisionView sorted by creation date (newest first)
   */
  async execute(status: DecisionStatusFilter = "all"): Promise<DecisionView[]> {
    return this.decisionListReader.findAll(status);
  }
}
