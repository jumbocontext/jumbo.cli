import { SolutionContextView } from "./SolutionContextView.js";

/**
 * ISolutionContextReader - Port interface for reading aggregated solution context
 *
 * Infrastructure implementations query the data store and return solution views.
 * Application layer services (like UnprimedBrownfieldQualifier) use this data
 * to make business decisions.
 */
export interface ISolutionContextReader {
  /**
   * Get all solution context recorded in Jumbo
   *
   * @returns Aggregated view of architecture, components, decisions, invariants, guidelines
   */
  getSolutionContext(): Promise<SolutionContextView>;
}
