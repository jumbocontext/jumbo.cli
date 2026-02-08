export interface AddDependencyCommand {
  consumerId: string;
  providerId: string;
  endpoint?: string;
  contract?: string;
}
