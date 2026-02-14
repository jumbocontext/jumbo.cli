import { DecisionView } from "../../decisions/DecisionView.js";

/**
 * Port interface for reading decisions for goal context.
 * Used by GoalContextAssembler to fetch decisions for context assembly.
 */
export interface IDecisionContextReader {
  findAllActive(): Promise<DecisionView[]>;
  findByIds(ids: string[]): Promise<DecisionView[]>;
}
