export interface IProjectRootResolver {
  resolve(): string;
  resolveOrDefault(): string;
  findNearest(): string | null;
}
