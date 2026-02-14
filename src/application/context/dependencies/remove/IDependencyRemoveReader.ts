import { DependencyView } from "../DependencyView.js";

/**
 * Port interface for reading dependency projections.
 * Used by RemoveDependencyCommandHandler to check dependency existence.
 */
export interface IDependencyRemoveReader {
  findById(dependencyId: string): Promise<DependencyView | null>;
}
