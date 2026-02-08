import { ComponentView } from "../../components/ComponentView.js";

/**
 * Port interface for reading components for goal context.
 * Used by GetGoalContextQueryHandler to filter components by scope.
 */
export interface IComponentContextReader {
  findAll(): Promise<ComponentView[]>;
}
