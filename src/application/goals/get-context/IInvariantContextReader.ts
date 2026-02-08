import { InvariantView } from "../../invariants/InvariantView.js";

/**
 * Port interface for reading invariants for goal context.
 * Used by GetGoalContextQueryHandler to retrieve all invariants.
 */
export interface IInvariantContextReader {
  findAll(): Promise<InvariantView[]>;
}
