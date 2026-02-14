import { DependencyView } from "../DependencyView.js";

/**
 * Port interface for reading dependency projections.
 * Used by UpdateDependencyCommandHandler to check dependency existence.
 */
export interface IDependencyUpdateReader {
  findById(dependencyId: string): Promise<DependencyView | null>;
}
