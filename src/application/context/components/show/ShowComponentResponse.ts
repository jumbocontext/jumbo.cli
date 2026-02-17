import { ComponentView } from "../ComponentView.js";
import { RelationView } from "../../relations/RelationView.js";

export interface ShowComponentResponse {
  readonly component: ComponentView;
  readonly relations: RelationView[];
}
