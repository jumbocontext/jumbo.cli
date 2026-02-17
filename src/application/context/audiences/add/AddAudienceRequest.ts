import { AudiencePriorityType } from "../../../../domain/audiences/Constants.js";

export interface AddAudienceRequest {
  readonly name: string;
  readonly description: string;
  readonly priority: AudiencePriorityType;
}
