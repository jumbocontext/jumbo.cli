import { DecisionStatusFilter } from "./IDecisionViewReader.js";

export interface GetDecisionsRequest {
  readonly status: DecisionStatusFilter;
}
