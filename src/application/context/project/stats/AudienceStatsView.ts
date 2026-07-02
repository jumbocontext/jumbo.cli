import type { PrimaryAudiences } from "./PrimaryAudiences.js";
import type { SecondaryAudiences } from "./SecondaryAudiences.js";
import type { TotalAudiences } from "./TotalAudiences.js";

export type AudienceStatsView = {
  readonly totalAudiences: TotalAudiences;
  readonly primaryAudiences: PrimaryAudiences;
  readonly secondaryAudiences: SecondaryAudiences;
};
