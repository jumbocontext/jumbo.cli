import { GuidelineView } from "../../guidelines/GuidelineView.js";

/**
 * Port interface for reading guidelines for goal context.
 * Used by GoalContextAssembler to fetch guidelines for context assembly.
 */
export interface IGuidelineContextReader {
  findAll(): Promise<GuidelineView[]>;
  findByIds(ids: string[]): Promise<GuidelineView[]>;
}
