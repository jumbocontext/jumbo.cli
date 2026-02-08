import { DecisionView } from "../../decisions/DecisionView.js";

/**
 * Port interface for reading decisions for goal context.
 * Used by GetGoalContextQueryHandler to get active decisions.
 */
export interface IDecisionContextReader {
  findAllActive(): Promise<DecisionView[]>;
}
