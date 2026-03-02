export interface AddDependencyCommand {
  name?: string;
  ecosystem?: string;
  packageName?: string;
  versionConstraint?: string | null;
  endpoint?: string;
  contract?: string;
}
