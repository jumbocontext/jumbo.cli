import { ComponentTypeValue } from "../../../../domain/components/Constants.js";

export interface UpdateComponentCommand {
  componentId: string;
  description?: string;
  responsibility?: string;
  path?: string;
  type?: ComponentTypeValue;
}
