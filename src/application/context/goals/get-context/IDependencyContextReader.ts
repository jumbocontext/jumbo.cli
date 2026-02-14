import { DependencyView } from "../../../../application/context/dependencies/DependencyView.js";

/**
 * Port interface for reading dependencies for goal context.
 * Used by GoalContextAssembler to fetch dependencies for context assembly.
 */
export interface IDependencyContextReader {
  findAll(): Promise<DependencyView[]>;
  findByIds(ids: string[]): Promise<DependencyView[]>;
}
