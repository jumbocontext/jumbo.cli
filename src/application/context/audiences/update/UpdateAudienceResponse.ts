import { AudienceView } from "../AudienceView.js";

export interface UpdateAudienceResponse {
  readonly audienceId: string;
  readonly view: AudienceView | null;
}
