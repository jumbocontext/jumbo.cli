import { InvariantView } from "../../invariants/InvariantView.js";

/**
 * Port interface for reading invariants for goal context.
 * Used by GoalContextAssembler to fetch invariants for context assembly.
 */
export interface IInvariantContextReader {
  findAll(): Promise<InvariantView[]>;
  findByIds(ids: string[]): Promise<InvariantView[]>;
}
