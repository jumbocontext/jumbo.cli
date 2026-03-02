export interface SkippedDependency {
  readonly dependencyId: string;
  readonly reason: string;
}

export interface ConvertedDependency {
  readonly dependencyId: string;
  readonly relationId: string;
  readonly fromEntityId: string;
  readonly toEntityId: string;
}

export interface MigrateDependenciesResponse {
  readonly converted: ConvertedDependency[];
  readonly skipped: SkippedDependency[];
  readonly totalLegacy: number;
  readonly dryRun: boolean;
}
