import { DependencyView } from "../DependencyView.js";

/**
 * Port interface for reading dependency projections.
 * Used by AddDependencyCommandHandler to check dependency existence (idempotency).
 */
export interface IDependencyAddReader {
  findById(dependencyId: string): Promise<DependencyView | null>;
}
