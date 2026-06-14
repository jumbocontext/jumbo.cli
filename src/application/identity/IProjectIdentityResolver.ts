export type ProjectHistoryProbe = (projectId: string) => Promise<boolean>;

export interface IProjectIdentityResolver {
  generateProjectId(): string;
  persistProjectId(projectId: string): Promise<void>;
  resolveExistingProjectId(
    projectedProjectId: string,
    hasProjectHistory?: ProjectHistoryProbe,
  ): Promise<string>;
}
