import { DecisionView } from "../DecisionView.js";

export interface IDecisionRestoreReader {
  findById(id: string): Promise<DecisionView | null>;
}
