import { AudiencePriorityType } from "../../../../domain/audiences/Constants.js";

export interface UpdateAudienceRequest {
  readonly audienceId: string;
  readonly name?: string;
  readonly description?: string;
  readonly priority?: AudiencePriorityType;
}
