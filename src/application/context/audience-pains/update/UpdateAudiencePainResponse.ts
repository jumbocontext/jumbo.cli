import { AudiencePainView } from "../AudiencePainView.js";

export interface UpdateAudiencePainResponse {
  readonly painId: string;
  readonly view: AudiencePainView | null;
}
