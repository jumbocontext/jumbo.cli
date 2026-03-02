import { LegacyDependencyCandidate } from "./LegacyDependencyCandidate.js";

/**
 * Port interface for reading legacy component-coupling dependency records.
 * Used by MigrateDependenciesCommandHandler to identify migration candidates.
 */
export interface ILegacyDependencyReader {
  findLegacyCouplings(): Promise<LegacyDependencyCandidate[]>;
}
