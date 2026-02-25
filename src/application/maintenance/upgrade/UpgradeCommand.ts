/**
 * Command to upgrade the event store from one version to another.
 */
export interface UpgradeCommand {
  readonly from: string;
  readonly to: string;
}
