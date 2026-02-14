import { ComponentView } from "../../components/ComponentView.js";

/**
 * Port interface for reading components for goal context.
 * Used by GoalContextAssembler to fetch components for context assembly.
 */
export interface IComponentContextReader {
  findAll(): Promise<ComponentView[]>;
  findByIds(ids: string[]): Promise<ComponentView[]>;
}
