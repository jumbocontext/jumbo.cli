export interface AddDependencyCommand {
  name?: string;
  ecosystem?: string;
  packageName?: string;
  versionConstraint?: string | null;
  consumerId?: string;
  providerId?: string;
  endpoint?: string;
  contract?: string;
}
