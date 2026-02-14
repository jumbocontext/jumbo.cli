import { ComponentTypeValue } from "../../../../domain/components/Constants.js";

export interface AddComponentCommand {
  name: string;
  type: ComponentTypeValue;
  description: string;
  responsibility: string;
  path: string;
}
