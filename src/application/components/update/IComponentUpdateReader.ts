import { ComponentView } from "../ComponentView.js";

export interface IComponentUpdateReader {
  findById(id: string): Promise<ComponentView | null>;
}
