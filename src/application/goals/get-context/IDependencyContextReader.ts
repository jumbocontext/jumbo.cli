import { DependencyView } from "../../../application/dependencies/DependencyView.js";

/**
 * Port interface for reading dependencies for goal context.
 * Used by GetGoalContextQueryHandler to filter dependencies by scoped components.
 */
export interface IDependencyContextReader {
  findAll(): Promise<DependencyView[]>;
}
