import { ComponentView } from "../ComponentView.js";

export interface UpdateComponentResponse {
  readonly componentId: string;
  readonly view: ComponentView | null;
}
