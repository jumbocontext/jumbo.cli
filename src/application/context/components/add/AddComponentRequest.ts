import { ComponentTypeValue } from "../../../../domain/components/Constants.js";

export interface AddComponentRequest {
  readonly name: string;
  readonly type: ComponentTypeValue;
  readonly description: string;
  readonly responsibility: string;
  readonly path: string;
}
