/**
 * AddAudience Command
 *
 * Command to add a new target audience to the project.
 */

import { AudiencePriorityType } from "../../../../domain/audiences/Constants.js";

export interface AddAudienceCommand {
  name: string;
  description: string;
  priority: AudiencePriorityType;
}
