import { ComponentView } from "../ComponentView.js";

export interface IComponentUndeprecateReader {
  findById(id: string): Promise<ComponentView | null>;
}
