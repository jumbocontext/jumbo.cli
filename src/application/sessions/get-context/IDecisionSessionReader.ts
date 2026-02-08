import { DecisionView } from "../../decisions/DecisionView.js";

/**
 * Port interface for reading decisions for session summary updates.
 * Used by SessionSummaryProjectionHandler to enrich decision events.
 */
export interface IDecisionSessionReader {
  findById(id: string): Promise<DecisionView | null>;
}
