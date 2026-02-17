import { ComponentTypeValue } from "../../../../domain/components/Constants.js";

export interface UpdateComponentRequest {
  readonly componentId: string;
  readonly description?: string;
  readonly responsibility?: string;
  readonly path?: string;
  readonly type?: ComponentTypeValue;
}
