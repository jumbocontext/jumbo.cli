import { ComponentView } from "../ComponentView.js";

export interface IComponentAddReader {
  findByName(name: string): Promise<ComponentView | null>;
}
