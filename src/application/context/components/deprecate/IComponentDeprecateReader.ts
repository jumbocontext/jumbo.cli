import { ComponentView } from "../ComponentView.js";

export interface IComponentDeprecateReader {
  findById(id: string): Promise<ComponentView | null>;
}
