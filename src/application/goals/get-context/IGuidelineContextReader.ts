import { GuidelineView } from "../../guidelines/GuidelineView.js";

/**
 * Port interface for reading guidelines for goal context.
 * Used by GetGoalContextQueryHandler to retrieve all guidelines.
 */
export interface IGuidelineContextReader {
  findAll(): Promise<GuidelineView[]>;
}
