import { ComponentView } from "../ComponentView.js";

export interface IComponentRemoveReader {
  findById(id: string): Promise<ComponentView | null>;
}
